// MODIFIED FILE — replace the full content of: src/components/admin/CertificateTemplate.tsx
import { forwardRef } from 'react';

export interface CertificateTemplateData {
  memberName: string;
  title: string;
  description?: string | null;
  certificateCode: string;
  issuedAt: string; // ISO date string
  clubName?: string;
  /** If set, this image is used as the full-bleed background instead of the built-in decorative border design. */
  backgroundImageUrl?: string | null;
  /** If set, this (ideally transparent PNG) image is drawn above the "Authorized Signature" line. */
  signatureImageUrl?: string | null;
}

/**
 * Fixed-size (1200x850px, landscape) certificate design.
 * Rendered off-screen in CertificateGenerator.tsx and captured with
 * html2canvas -> jsPDF. Uses inline styles only (no Tailwind classes)
 * because html2canvas cannot reliably render modern Tailwind color
 * functions like oklch().
 */
const CertificateTemplate = forwardRef<HTMLDivElement, CertificateTemplateData>(
  (
    {
      memberName,
      title,
      description,
      certificateCode,
      issuedAt,
      clubName = 'ClubSync',
      backgroundImageUrl,
      signatureImageUrl,
    },
    ref
  ) => {
    const formattedDate = new Date(issuedAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const SignatureImg = signatureImageUrl ? (
      // eslint-disable-next-line jsx-a11y/alt-text
      <img
        src={signatureImageUrl}
        crossOrigin="anonymous"
        style={{ height: 36, objectFit: 'contain', display: 'block', marginBottom: -4 }}
      />
    ) : null;

    // ---- Path A: admin uploaded their own background artwork ----
    // Text is overlaid on a translucent white card so it stays readable
    // regardless of what colors/images are in the background art.
    if (backgroundImageUrl) {
      return (
        <div
          ref={ref}
          style={{
            width: 1200,
            height: 850,
            position: 'relative',
            fontFamily: 'Georgia, "Times New Roman", serif',
            overflow: 'hidden',
          }}
        >
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <img
            src={backgroundImageUrl}
            crossOrigin="anonymous"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />

          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '50px 70px',
            }}
          >
            <div
              style={{
                background: 'rgba(255,255,255,0.9)',
                borderRadius: 18,
                padding: '46px 64px',
                maxWidth: 820,
                boxShadow: '0 6px 30px rgba(0,0,0,0.18)',
              }}
            >
              <div style={{ fontSize: 20, letterSpacing: 4, color: '#1e3a5f', fontWeight: 700, textTransform: 'uppercase' }}>
                {clubName}
              </div>

              <div style={{ width: 80, height: 3, background: '#c9a24b', margin: '14px auto 22px' }} />

              <div style={{ fontSize: 36, color: '#1e3a5f', fontWeight: 700, letterSpacing: 1 }}>
                Certificate of Achievement
              </div>

              <div style={{ fontSize: 14, color: '#555', marginTop: 22 }}>This is proudly presented to</div>

              <div
                style={{
                  fontSize: 38,
                  color: '#111',
                  fontWeight: 700,
                  margin: '14px 0',
                  fontFamily: '"Brush Script MT", cursive, Georgia, serif',
                }}
              >
                {memberName}
              </div>

              <div style={{ width: '60%', height: 1, background: '#c9a24b', margin: '8px auto 20px' }} />

              <div style={{ fontSize: 17, color: '#1e3a5f', fontWeight: 600 }}>{title}</div>

              {description && (
                <div style={{ fontSize: 13, color: '#666', marginTop: 12, lineHeight: 1.6 }}>{description}</div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 30, gap: 40 }}>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 11, color: '#888' }}>Date Issued</div>
                  <div style={{ fontSize: 13, color: '#222', fontWeight: 600, borderTop: '1px solid #ccc', paddingTop: 5, marginTop: 3 }}>
                    {formattedDate}
                  </div>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 11, color: '#888' }}>Authorized Signature</div>
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', minHeight: 40 }}>
                    {SignatureImg}
                    <div style={{ fontSize: 13, color: '#222', fontWeight: 600, borderTop: '1px solid #ccc', paddingTop: 5, marginTop: 3, minWidth: 140 }}>
                      &nbsp;
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: '#888' }}>Certificate ID</div>
                  <div style={{ fontSize: 13, color: '#222', fontWeight: 600, borderTop: '1px solid #ccc', paddingTop: 5, marginTop: 3 }}>
                    {certificateCode}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // ---- Path B: no custom background — built-in decorative design ----
    return (
      <div
        ref={ref}
        style={{
          width: 1200,
          height: 850,
          background: '#ffffff',
          position: 'relative',
          fontFamily: 'Georgia, "Times New Roman", serif',
          boxSizing: 'border-box',
          padding: 40,
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            border: '3px solid #1e3a5f',
            boxSizing: 'border-box',
            padding: 24,
            position: 'relative',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              border: '1px solid #c9a24b',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '50px 70px',
            }}
          >
            <div style={{ fontSize: 22, letterSpacing: 4, color: '#1e3a5f', fontWeight: 700, textTransform: 'uppercase' }}>
              {clubName}
            </div>

            <div style={{ width: 90, height: 3, background: '#c9a24b', margin: '18px 0 28px' }} />

            <div style={{ fontSize: 42, color: '#1e3a5f', fontWeight: 700, letterSpacing: 2 }}>
              Certificate of Achievement
            </div>

            <div style={{ fontSize: 16, color: '#555', marginTop: 30 }}>This is proudly presented to</div>

            <div
              style={{
                fontSize: 46,
                color: '#111',
                fontWeight: 700,
                margin: '18px 0',
                fontFamily: '"Brush Script MT", cursive, Georgia, serif',
              }}
            >
              {memberName}
            </div>

            <div style={{ width: '55%', height: 1, background: '#c9a24b', margin: '10px 0 26px' }} />

            <div style={{ fontSize: 20, color: '#1e3a5f', fontWeight: 600, maxWidth: 780 }}>{title}</div>

            {description && (
              <div style={{ fontSize: 15, color: '#666', marginTop: 14, maxWidth: 760, lineHeight: 1.6 }}>
                {description}
              </div>
            )}

            <div
              style={{
                position: 'absolute',
                bottom: 46,
                left: 70,
                right: 70,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
              }}
            >
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 13, color: '#888' }}>Date Issued</div>
                <div style={{ fontSize: 15, color: '#222', fontWeight: 600, borderTop: '1px solid #ccc', paddingTop: 6, marginTop: 4 }}>
                  {formattedDate}
                </div>
              </div>
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <div style={{ fontSize: 13, color: '#888' }}>Authorized Signature</div>
                {SignatureImg}
                <div style={{ fontSize: 15, color: '#222', fontWeight: 600, borderTop: '1px solid #ccc', paddingTop: 6, marginTop: 4, minWidth: 160 }}>
                  &nbsp;
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, color: '#888' }}>Certificate ID</div>
                <div style={{ fontSize: 15, color: '#222', fontWeight: 600, borderTop: '1px solid #ccc', paddingTop: 6, marginTop: 4 }}>
                  {certificateCode}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

CertificateTemplate.displayName = 'CertificateTemplate';

export default CertificateTemplate;