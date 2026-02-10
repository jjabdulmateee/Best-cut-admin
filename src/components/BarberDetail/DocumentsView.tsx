import { BarberDocumentUrls } from "@/lib/types/barber";
import { ExternalLink, Image as ImageIcon, FileSearch, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

type Props = {
  documents?: BarberDocumentUrls;
};

export const DocumentsView = ({ documents }: Props) => {
  if (!documents) {
    return (
      <div className="rounded-3xl border border-dashed border-border p-12 text-center text-muted-foreground space-y-4">
        <FileSearch size={48} className="mx-auto opacity-20" />
        <p className="text-xs font-bold uppercase tracking-widest">No Intelligence Data Uploaded</p>
      </div>
    );
  }

  const { profilePicture, idDocument, idCard, shopPhotos, certificates, otherDocuments } = documents;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <h3 className="text-xl font-bold tracking-tight flex items-center gap-2">
          Document Intelligence
          <span className="text-[10px] bg-brand-500/20 text-brand-400 px-2 py-0.5 rounded uppercase">Encrypted</span>
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Profile Section */}
        {profilePicture && (
          <DocSection label="Biometric Profile Photo">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="relative group cursor-zoom-in"
            >
              <img
                src={profilePicture}
                alt="Profile"
                className="w-full aspect-square object-cover rounded-2xl border border-border shadow-2xl"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                <ExternalLink className="text-white" size={24} />
              </div>
            </motion.div>
          </DocSection>
        )}

        {/* ID Section */}
        {(idCard && idCard.length > 0) || idDocument ? (
          <DocSection label="Legal Identification (Front / Back)">
            <div className="grid grid-cols-1 gap-4">
              {idCard?.map((url, idx) => (
                <DocThumbnail key={idx} src={url} label={`ID Card Slot ${idx + 1}`} />
              )) ?? (idDocument && <DocLink url={idDocument} label="View Legal ID Document" />)}
            </div>
          </DocSection>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Shop Photos */}
        {shopPhotos && shopPhotos.length > 0 && (
          <DocSection label="Physical Facility Verification">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {shopPhotos.map((photo, idx) => (
                <DocThumbnail key={idx} src={photo} label={`Interior ${idx + 1}`} />
              ))}
            </div>
          </DocSection>
        )}

        {/* Certificates */}
        {certificates && certificates.length > 0 && (
          <DocSection label="Professional Accomplishments & Certification">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {certificates.map((url, idx) => (
                <DocThumbnail key={idx} src={url} label={`Cert ${idx + 1}`} />
              ))}
            </div>
          </DocSection>
        )}
      </div>

      {/* Other Docs */}
      {otherDocuments && otherDocuments.length > 0 && (
        <DocSection label="Supplemental Forensic Data">
          <div className="space-y-3">
            {otherDocuments.map((doc, idx) => (
              <a
                key={idx}
                href={doc}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400">
                    <FileSearch size={16} />
                  </div>
                  <span className="text-sm font-bold">Supplemental Asset {idx + 1}</span>
                </div>
                <ExternalLink size={14} className="text-muted-foreground group-hover:text-white transition-colors" />
              </a>
            ))}
          </div>
        </DocSection>
      )}
    </div>
  );
};

const DocThumbnail = ({ src, label }: { src: string; label: string }) => (
  <motion.a
    href={src}
    target="_blank"
    rel="noreferrer"
    whileHover={{ y: -4 }}
    className="relative group block aspect-video rounded-xl overflow-hidden border border-border bg-card"
  >
    <img src={src} alt={label} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
      <div className="flex items-center justify-between w-full">
        <span className="text-[10px] font-black uppercase tracking-widest text-white">{label}</span>
        <ExternalLink size={12} className="text-white" />
      </div>
    </div>
  </motion.a>
);

const DocSection = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-4">
    <div className="flex items-center gap-3">
      <div className="h-6 w-1 bg-brand-600 rounded-full" />
      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{label}</h4>
    </div>
    {children}
  </div>
);

const DocLink = ({ url, label }: { url: string; label: string }) => (
  <a
    href={url}
    target="_blank"
    rel="noreferrer"
    className="flex items-center justify-between p-4 rounded-xl border border-brand-500/20 bg-brand-500/5 hover:border-brand-500/50 transition-all group"
  >
    <span className="text-sm font-bold text-brand-400">{label}</span>
    <ExternalLink size={14} className="text-brand-400" />
  </a>
);
