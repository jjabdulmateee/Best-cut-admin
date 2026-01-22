import { BarberDocumentUrls } from "@/lib/types/barber";

type Props = {
  documents?: BarberDocumentUrls;
};

export const DocumentsView = ({ documents }: Props) => {
  if (!documents) {
    return (
      <div className="rounded-xl border border-brand-700 bg-brand-800 p-6 text-gray-400">
        No documents uploaded.
      </div>
    );
  }

  const { profilePicture, idDocument, idCard, shopPhotos, certificates, otherDocuments } = documents;

  return (
    <div className="rounded-xl border border-brand-700 bg-brand-800 p-6 space-y-6">
      <h3 className="text-lg font-semibold border-b border-brand-700 pb-2">Documents</h3>

      {profilePicture && (
        <DocBlock label="Profile picture">
          <img
            src={profilePicture}
            alt="Profile"
            className="w-32 h-32 object-cover rounded-lg border border-brand-700"
          />
        </DocBlock>
      )}

      {/* Legacy or New ID Card handling */}
      {(idCard && idCard.length > 0) || idDocument ? (
        <DocBlock label="Identity Document (CNIC)">
          <div className="flex gap-4 overflow-x-auto pb-2">
            {/* Prefer new array format, fallback to legacy string */}
            {idCard?.map((url, idx) => (
              <DocImage key={idx} src={url} alt={`ID Card ${idx + 1}`} />
            )) ?? (idDocument && <DocLink url={idDocument} label="View ID Document" />)}
          </div>
        </DocBlock>
      ) : null}

      {certificates && certificates.length > 0 && (
        <DocBlock label="Certificates">
          <div className="flex gap-4 overflow-x-auto pb-2">
            {certificates.map((url, idx) => (
              <DocImage key={idx} src={url} alt={`Certificate ${idx + 1}`} />
            ))}
          </div>
        </DocBlock>
      )}

      {shopPhotos && shopPhotos.length > 0 && (
        <DocBlock label="Shop photos">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {shopPhotos.map((photo, idx) => (
              <DocImage key={idx} src={photo} alt={`Shop ${idx + 1}`} className="w-full h-32" />
            ))}
          </div>
        </DocBlock>
      )}

      {otherDocuments && otherDocuments.length > 0 && (
        <DocBlock label="Other documents">
          <ul className="list-disc list-inside space-y-1 text-success">
            {otherDocuments.map((doc, idx) => (
              <li key={`doc-${idx}`}>
                <a href={doc} target="_blank" rel="noreferrer" className="hover:underline">
                  Document {idx + 1}
                </a>
              </li>
            ))}
          </ul>
        </DocBlock>
      )}
    </div>
  );
};

const DocImage = ({ src, alt, className }: { src: string; alt: string, className?: string }) => (
  <a href={src} target="_blank" rel="noreferrer" className="block shrink-0">
    <img
      src={src}
      alt={alt}
      className={className || "h-32 w-auto object-cover rounded-lg border border-brand-700 hover:opacity-90 transition-opacity"}
    />
  </a>
);

const DocLink = ({ url, label }: { url: string; label: string }) => (
  <a
    href={url}
    target="_blank"
    rel="noreferrer"
    className="text-success hover:underline border border-success/30 px-3 py-2 rounded-lg bg-success/5"
  >
    {label}
  </a>
);

const DocBlock = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-2">
    <p className="text-sm text-gray-400">{label}</p>
    <div>{children}</div>
  </div>
);
