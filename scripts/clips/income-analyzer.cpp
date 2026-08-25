// income-analyzer — BiiA LAB revenue snapshot (Stripe + YouTube) in one binary.
//
//   clang++ -std=c++17 -O2 income-analyzer.cpp -lcurl -o income-analyzer
//   STRIPE_SECRET_KEY=sk_... YT_ACCESS_TOKEN=ya29... ./income-analyzer
//
// Stripe: walks /v1/charges (paginated), groups paid charges into certificate /
// diplomado / other buckets, reports 7d & 30d totals and a monthly run rate.
// YouTube: queries the Analytics API estimatedRevenue by day (needs the
// yt-analytics-monetary.readonly scope; prints a hint if the token lacks it).

#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <ctime>
#include <string>
#include <vector>
#include <map>
#include <curl/curl.h>

static size_t sink(char *data, size_t size, size_t nmemb, void *out) {
    ((std::string *)out)->append(data, size * nmemb);
    return size * nmemb;
}

static std::string http_get(const std::string &url, const std::string &auth_header) {
    CURL *curl = curl_easy_init();
    std::string body;
    struct curl_slist *headers = curl_slist_append(nullptr, auth_header.c_str());
    curl_easy_setopt(curl, CURLOPT_URL, url.c_str());
    curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, sink);
    curl_easy_setopt(curl, CURLOPT_WRITEDATA, &body);
    curl_easy_setopt(curl, CURLOPT_TIMEOUT, 60L);
    CURLcode rc = curl_easy_perform(curl);
    curl_slist_free_all(headers);
    curl_easy_cleanup(curl);
    if (rc != CURLE_OK) { fprintf(stderr, "curl: %s\n", curl_easy_strerror(rc)); exit(1); }
    return body;
}

// Tiny scanners for the handful of fields we need (values are numeric or quoted).
static long json_long(const std::string &s, size_t from, const char *key) {
    size_t k = s.find(std::string("\"") + key + "\":", from);
    if (k == std::string::npos) return -1;
    return atol(s.c_str() + k + strlen(key) + 3);
}
static std::string json_str(const std::string &s, size_t from, const char *key) {
    size_t k = s.find(std::string("\"") + key + "\": \"", from);
    size_t skip = strlen(key) + 5;
    if (k == std::string::npos) { k = s.find(std::string("\"") + key + "\":\"", from); skip = strlen(key) + 4; }
    if (k == std::string::npos) return "";
    size_t a = k + skip, b = s.find('"', a);
    return s.substr(a, b - a);
}

struct Charge { long created; double usd; std::string kind; };

int main() {
    const char *sk = getenv("STRIPE_SECRET_KEY");
    const char *yt = getenv("YT_ACCESS_TOKEN");
    time_t now = time(nullptr);
    std::vector<Charge> charges;

    // ---------------------------------------------------------------- Stripe
    if (sk) {
        std::string auth = std::string("Authorization: Bearer ") + sk, after;
        for (int page = 0; page < 20; page++) {
            std::string url = "https://api.stripe.com/v1/charges?limit=100" + (after.empty() ? "" : "&starting_after=" + after);
            std::string body = http_get(url, auth);
            if (body.find("\"error\"") != std::string::npos && body.find("\"data\"") == std::string::npos) {
                fprintf(stderr, "Stripe error: %.200s\n", body.c_str());
                break;
            }
            size_t pos = 0; bool any = false;
            while ((pos = body.find("\"object\": \"charge\"", pos)) != std::string::npos) {
                any = true;
                long amount = json_long(body, pos, "amount");
                long created = json_long(body, pos, "created");
                bool paid = body.find("\"paid\": true", pos) != std::string::npos &&
                            body.find("\"paid\": true", pos) < pos + 4000;
                bool refunded = body.find("\"refunded\": true", pos) != std::string::npos &&
                                body.find("\"refunded\": true", pos) < pos + 4000;
                std::string desc = json_str(body, pos, "description");
                std::string id = json_str(body, pos, "id");
                if (paid && !refunded && amount > 0) {
                    std::string k = "other";
                    if (desc.find("ertificad") != std::string::npos || desc.find("ertificate") != std::string::npos) k = "certificado";
                    else if (desc.find("iplomado") != std::string::npos) k = "diplomado";
                    charges.push_back({created, amount / 100.0, k});
                }
                after = id;
                pos += 20;
            }
            if (!any || body.find("\"has_more\": true") == std::string::npos) break;
        }
    }

    printf("=== BiiA LAB income snapshot ===\n\n");
    if (!sk) {
        printf("[stripe] STRIPE_SECRET_KEY not set; skipping.\n");
    } else {
        std::map<std::string, double> total, d7, d30;
        std::map<std::string, int> n, n7, n30;
        for (auto &c : charges) {
            total[c.kind] += c.usd; n[c.kind]++;
            if (now - c.created <= 7 * 86400)  { d7[c.kind] += c.usd;  n7[c.kind]++; }
            if (now - c.created <= 30 * 86400) { d30[c.kind] += c.usd; n30[c.kind]++; }
        }
        double g = 0, g7 = 0, g30 = 0;
        printf("[stripe]  %-12s %10s %14s %14s\n", "product", "all-time", "last 7d", "last 30d");
        for (auto &kv : total) {
            printf("          %-12s %7.2f$ x%-3d %8.2f$ x%-3d %8.2f$ x%-3d\n",
                   kv.first.c_str(), kv.second, n[kv.first], d7[kv.first], n7[kv.first], d30[kv.first], n30[kv.first]);
            g += kv.second; g7 += d7[kv.first]; g30 += d30[kv.first];
        }
        printf("          %-12s %7.2f$      %8.2f$      %8.2f$\n", "TOTAL", g, g7, g30);
        double run = (g7 / 7.0) * 30.0;
        printf("          run rate (7d basis): %.2f$/month   (30d basis: %.2f$/month)\n\n", run, g30);
    }

    // --------------------------------------------------------------- YouTube
    if (!yt) {
        printf("[youtube] YT_ACCESS_TOKEN not set; skipping.\n");
    } else {
        char sd[16], ed[16];
        time_t start = now - 30 * 86400;
        strftime(sd, 16, "%Y-%m-%d", gmtime(&start));
        strftime(ed, 16, "%Y-%m-%d", gmtime(&now));
        std::string url = std::string("https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==MINE&startDate=")
            + sd + "&endDate=" + ed + "&metrics=estimatedRevenue,estimatedAdRevenue,views,monetizedPlaybacks&dimensions=day&sort=day";
        std::string body = http_get(url, std::string("Authorization: Bearer ") + yt);
        if (body.find("\"rows\"") == std::string::npos) {
            if (body.find("nsufficient") != std::string::npos || body.find("PERMISSION") != std::string::npos || body.find("403") != std::string::npos)
                printf("[youtube] token lacks yt-analytics-monetary.readonly scope.\n"
                       "          Re-auth after adding the scope to upload.mjs to see ad revenue here.\n");
            else
                printf("[youtube] no revenue rows (channel report empty).\n          raw: %.160s\n", body.c_str());
        } else {
            double rev = 0, ad = 0; long vws = 0, mon = 0;
            size_t pos = body.find("\"rows\"");
            while ((pos = body.find("[\n", pos)) != std::string::npos) {
                size_t q = body.find('"', pos);
                if (q == std::string::npos) break;
                double r = 0, a = 0; long v = 0, m = 0;
                if (sscanf(body.c_str() + q, "\"%*10c\",\n      %lf,\n      %lf,\n      %ld,\n      %ld", &r, &a, &v, &m) >= 2) {
                    rev += r; ad += a; vws += v; mon += m;
                }
                pos = q + 1;
            }
            printf("[youtube] last 30d: %.2f$ estimated revenue (%.2f$ ads), %ld views, %ld monetized playbacks\n", rev, ad, vws, mon);
            printf("          run rate: %.2f$/month\n", rev);
        }
    }
    printf("\nNote: certificate USD 19 / diplomado USD 49 checkouts land in Stripe; ad money in YouTube.\n");
    return 0;
}
