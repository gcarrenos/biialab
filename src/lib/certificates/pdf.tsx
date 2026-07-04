import { Document, Page, View, Text, Svg, Circle, Path, StyleSheet, Font, renderToBuffer } from '@react-pdf/renderer';

export interface CertificatePdfData {
  certificateNumber: string;
  issuedAt: string;
  courseTitle: string;
  courseCategory: string | null;
  totalLessons: number | null;
  studentName: string;
  instructorName: string | null;
  instructorTitle: string | null;
}

const ACCENT = '#ff4d14';
const INK = '#1c1c1c';
const MUTED = '#6b6b6b';
const RIBBON_BG = '#faf6f2';

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
    color: INK,
    flexDirection: 'row',
  },
  frame: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    bottom: 16,
    borderWidth: 1.2,
    borderColor: ACCENT,
  },
  frameInner: {
    position: 'absolute',
    top: 21,
    left: 21,
    right: 21,
    bottom: 21,
    borderWidth: 0.6,
    borderColor: '#f3b9a4',
  },
  main: {
    flexGrow: 1,
    paddingTop: 56,
    paddingBottom: 56,
    paddingLeft: 64,
    paddingRight: 36,
    flexDirection: 'column',
  },
  ribbon: {
    width: 190,
    marginTop: 21,
    marginBottom: 21,
    marginRight: 21,
    backgroundColor: RIBBON_BG,
    borderLeftWidth: 1,
    borderLeftColor: '#eaded4',
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 40,
    flexDirection: 'column',
  },
  date: { fontSize: 10, color: MUTED, marginBottom: 26 },
  wordmark: { fontSize: 30, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  certifies: { fontSize: 11, color: MUTED, marginTop: 34, marginBottom: 14 },
  student: { fontFamily: 'Oswald', fontWeight: 700, fontSize: 36, textTransform: 'uppercase', marginBottom: 22 },
  completed: { fontSize: 11, color: MUTED, marginBottom: 10 },
  course: { fontFamily: 'Oswald', fontWeight: 600, fontSize: 22, textTransform: 'uppercase', marginBottom: 10 },
  courseMeta: { fontSize: 10, color: MUTED },
  bottomRow: { marginTop: 'auto', flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  instructorName: { fontSize: 12, fontFamily: 'Helvetica-Bold', paddingTop: 8, borderTopWidth: 0.8, borderTopColor: INK, minWidth: 170 },
  instructorRole: { fontSize: 9, color: MUTED, marginTop: 3 },
  verifyBlock: { alignItems: 'flex-end' },
  verifyText: { fontSize: 8.5, color: MUTED, textAlign: 'right', lineHeight: 1.5, maxWidth: 230 },
  credential: { fontSize: 9.5, fontFamily: 'Courier-Bold', color: INK, marginBottom: 4 },
  ribbonLabel: { fontFamily: 'Oswald', fontWeight: 600, fontSize: 15, textTransform: 'uppercase', letterSpacing: 3, color: INK, marginBottom: 4 },
  ribbonSub: { fontSize: 8.5, color: MUTED, letterSpacing: 1.5, textTransform: 'uppercase' },
});

function Seal() {
  return (
    <Svg width={120} height={120} viewBox="0 0 120 120">
      <Circle cx={60} cy={60} r={56} stroke={ACCENT} strokeWidth={2} fill="none" />
      <Circle cx={60} cy={60} r={49} stroke="#f3b9a4" strokeWidth={1} fill="none" />
      <Circle cx={60} cy={60} r={34} fill={ACCENT} />
      {/* check mark */}
      <Path d="M46 60 L56 70 L76 50" stroke="#ffffff" strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CertificateDocument({ cert }: { cert: CertificatePdfData }) {
  const issued = new Date(cert.issuedAt).toLocaleDateString('es-CO', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  const meta = [
    'Curso online gratuito de BiiA LAB',
    cert.courseCategory,
    cert.totalLessons ? `${cert.totalLessons} lecciones` : null,
  ].filter(Boolean).join('  ·  ');

  return (
    <Document
      title={`Certificado BiiALab — ${cert.studentName}`}
      author="BiiA LAB"
      subject={cert.courseTitle}
    >
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.frame} fixed />
        <View style={styles.frameInner} fixed />

        <View style={styles.main}>
          <Text style={styles.date}>{issued}</Text>
          <Text style={styles.wordmark}>
            <Text style={{ color: INK }}>BiiA</Text>
            <Text style={{ color: ACCENT }}>Lab</Text>
          </Text>
          <Text style={{ fontSize: 9, color: MUTED, letterSpacing: 2 }}>BIIALAB.ORG</Text>

          <Text style={styles.certifies}>certifica que</Text>
          <Text style={styles.student}>{cert.studentName}</Text>

          <Text style={styles.completed}>completó satisfactoriamente el curso</Text>
          <Text style={styles.course}>{cert.courseTitle}</Text>
          <Text style={styles.courseMeta}>{meta}</Text>

          <View style={styles.bottomRow}>
            <View>
              {cert.instructorName ? (
                <>
                  <Text style={styles.instructorName}>{cert.instructorName}</Text>
                  <Text style={styles.instructorRole}>
                    {cert.instructorTitle ? `${cert.instructorTitle} · ` : ''}Instructor del curso
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.instructorName}>BiiA LAB</Text>
                  <Text style={styles.instructorRole}>Plataforma educativa</Text>
                </>
              )}
            </View>
            <View style={styles.verifyBlock}>
              <Text style={styles.credential}>{cert.certificateNumber}</Text>
              <Text style={styles.verifyText}>Verifica esta credencial en</Text>
              <Text style={styles.verifyText}>www.biialab.org/verify/{cert.certificateNumber}</Text>
              <Text style={[styles.verifyText, { marginTop: 3 }]}>
                Certificado emitido tras aprobar el examen final del curso.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.ribbon}>
          <Text style={styles.ribbonLabel}>Certificado</Text>
          <Text style={styles.ribbonSub}>de curso</Text>
          <View style={{ marginTop: 60 }}>
            <Seal />
          </View>
          <Text style={{ fontSize: 8, color: MUTED, letterSpacing: 1.5, marginTop: 14, textTransform: 'uppercase' }}>
            Educación gratuita
          </Text>
        </View>
      </Page>
    </Document>
  );
}

let fontsRegistered = false;
function registerFonts(origin: string) {
  if (fontsRegistered) return;
  Font.register({
    family: 'Oswald',
    fonts: [
      { src: `${origin}/fonts/Oswald-SemiBold.ttf`, fontWeight: 600 },
      { src: `${origin}/fonts/Oswald-Bold.ttf`, fontWeight: 700 },
    ],
  });
  // No hyphenation — it inserts stray "-" into URLs and credential codes.
  Font.registerHyphenationCallback((word) => [word]);
  fontsRegistered = true;
}

export async function buildCertificatePdf(cert: CertificatePdfData, origin: string): Promise<Buffer> {
  registerFonts(origin);
  return renderToBuffer(<CertificateDocument cert={cert} />);
}
