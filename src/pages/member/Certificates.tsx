import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PageTitle, StatCard } from '../../components/member/MemberUI';
import { LoadingState, ErrorState, EmptyState } from '../../components/States';
import { getMyCertificates } from '../../lib/memberApi';

export default function Certificates() {
  const { member } = useAuth();
  const [certs, setCerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!member) return;
    getMyCertificates(member.id).then(setCerts).catch(() => setError(true)).finally(() => setLoading(false));
  }, [member]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message="Failed to load certificates." />;

  return (
    <div>
      <PageTitle title="My Certificates" subtitle="Certificates earned through your participation" />

      {certs.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total" value={certs.length} icon="M9 12l2 2 4-4M7.835 4.997a8.023 8.023 0 011.9-1.997" color="primary" />
        </div>
      )}

      {certs.length === 0 ? (
        <EmptyState title="No certificates yet" message="Certificates will appear here when issued by the club." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {certs.map(c => (
            <div key={c.id} className="card p-6 group hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 grid place-items-center shrink-0 shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.997a8.023 8.023 0 011.9-1.997C11.073 1.49 12.826.99 14.5 1.099c1.673.108 3.274.83 4.399 2.025a8.03 8.03 0 011.9 1.997M5.165 19.003a8.03 8.03 0 01-1.9-1.997C2.49 15.81 1.99 14.174 2.099 12.5c.108-1.673.83-3.274 2.025-4.399a8.03 8.03 0 011.997-1.9" /></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-semibold text-slate-900 dark:text-white">{c.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">Issued: {new Date(c.issued_at).toLocaleDateString()}</p>
                </div>
              </div>
              {c.description && <p className="text-sm text-slate-600 dark:text-slate-400 mt-3">{c.description}</p>}
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400">{c.certificate_code}</span>
                {c.file_url && <a href={c.file_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">Download</a>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
