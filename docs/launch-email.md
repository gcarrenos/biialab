# Waitlist launch email — draft (pending Klaviyo re-auth)

Audience: `waitlist` table subscribers (signed up pre-launch, never emailed).
Goal: first touch → free course enrollment. No hard sell; the certificate
upsell happens naturally after they pass an exam.

---

**Asunto:** Ya está aquí: cursos gratis de BiiA LAB con certificado

**Preheader:** Neuroventas, finanzas, productividad y más — gratis, a tu ritmo, con certificado para LinkedIn.

---

Hola,

Te escribimos porque te uniste a la lista de espera de **BiiA LAB** — y hoy por fin podemos decírtelo: **la plataforma está abierta.**

Esto es lo que te espera en [biialab.org](https://www.biialab.org/?utm_source=klaviyo&utm_medium=email&utm_campaign=waitlist_launch):

🎓 **Cursos 100% gratis**, basados en las conferencias que ya han visto millones de personas: neuroventas y persuasión, finanzas personales, productividad, comunicación de alto impacto, inteligencia emocional y más.

📜 **Certificado verificable al aprobar el examen final** de cada curso — con verificación pública y botón directo para añadirlo a tu perfil de LinkedIn.

⏰ **A tu ritmo.** Las lecciones quedan guardadas donde las dejaste.

**[Empezar mi primer curso →](https://www.biialab.org/?utm_source=klaviyo&utm_medium=email&utm_campaign=waitlist_launch)**

Un consejo para empezar: el curso de **Persuasión y neuromarketing** es el favorito de la comunidad — 5 lecciones directas al grano sobre cómo decide el cerebro de tus clientes.

Nos vemos adentro,
**El equipo de BiiA LAB**

_Recibes este correo porque te registraste en la lista de espera de biialab.org. Si ya no te interesa, puedes darte de baja aquí._

---

## Send checklist (when Klaviyo is connected)

1. Import waitlist emails (`/api/admin/waitlist` → CSV) into a Klaviyo list `waitlist-launch`.
2. Create campaign with the copy above; unsubscribe link via Klaviyo template footer.
3. Send window: Tue–Thu, 10:00 Colombia time.
4. Watch: open rate, CTR to biialab.org, GA4 `utm_campaign=waitlist_launch` sessions → enrollments.
