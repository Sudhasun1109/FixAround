import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { techniciansApi } from '../../services/api';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import { showToast } from '../../components/common/Toast';
import { formatDate } from '../../utils/formatters';
import {
  ShieldCheck,
  AlertCircle,
  Clock,
  Upload,
  FileCheck,
  FileText,
  CheckCircle,
  XCircle,
  ExternalLink,
  Paperclip,
} from 'lucide-react';

export default function VerificationStatus() {
  const { user } = useAuth();

  const [techProfile, setTechProfile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Upload Form
  const [docType, setDocType] = useState('ID_PROOF');
  const [docName, setDocName] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [uploadMode, setUploadMode] = useState('url'); // 'url' or 'file'
  const [fileName, setFileName] = useState('');
  const [uploading, setUploading] = useState(false);

  const fetchProfileAndDocs = useCallback(async () => {
    try {
      setLoading(true);
      const [pRes, dRes] = await Promise.all([
        techniciansApi.getProfile().catch(() => techniciansApi.getById(user?.id)).catch(() => ({ data: null })),
        techniciansApi.getDocuments().catch(() => ({ data: [] })),
      ]);

      setTechProfile(pRes?.data || pRes || user);
      const docList = dRes?.data?.documents || dRes?.data || [];
      setDocuments(Array.isArray(docList) ? docList : []);
    } catch (err) {
      console.error('Failed to load verification info:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfileAndDocs();
  }, [fetchProfileAndDocs]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast.error('File size exceeds 5MB limit');
      return;
    }

    setFileName(file.name);
    if (!docName.trim()) {
      setDocName(file.name.replace(/\.[^/.]+$/, ''));
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFileUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadDocument = async (e) => {
    e.preventDefault();
    if (!docName.trim() || !fileUrl.trim()) {
      showToast.error('Please specify document title and upload file or provide document URL');
      return;
    }

    try {
      setUploading(true);
      await techniciansApi.uploadDocument({
        document_type: docType,
        document_name: docName.trim(),
        file_url: fileUrl.trim(),
      });

      showToast.success('KYC Document submitted! Admin has been notified for review.');
      setDocName('');
      setFileUrl('');
      setFileName('');
      fetchProfileAndDocs();
    } catch (err) {
      showToast.error(err.message || 'Failed to submit document');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <Spinner fullScreen label="Checking KYC compliance status..." />;
  }

  const hasPendingDocs = documents.some((d) => d.status === 'PENDING');
  const profileStatus = techProfile?.verification_status || user?.verification_status || 'pending';
  const isApproved = profileStatus === 'approved' && !hasPendingDocs;
  const isPending = hasPendingDocs || profileStatus === 'pending';
  const isRejected = profileStatus === 'rejected';

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4">
      <div>
        <span className="text-xs font-bold text-fixteal-600 uppercase tracking-wider flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4" />
          KYC & Regulatory Compliance
        </span>
        <h1 className="text-2xl font-extrabold text-fixblue-900 mt-0.5">
          Identity & Trade Verification
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Upload government-issued identification and trade credentials to receive platform service dispatches.
        </p>
      </div>

      {/* Status Banner */}
      {isApproved && (
        <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-200 flex items-start gap-4 shadow-2xs">
          <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-700 shrink-0">
            <CheckCircle className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-emerald-900">
              Account Verified & Authorized
            </h3>
            <p className="text-xs text-emerald-700 leading-relaxed">
              Your credentials, government identity, and trade licensing have been approved by FixAround Administration. You have full priority access to standard and emergency customer jobs.
            </p>
          </div>
        </div>
      )}

      {isPending && (
        <div className="p-6 rounded-3xl bg-amber-50 border border-amber-200 flex items-start gap-4 shadow-2xs">
          <div className="p-3 rounded-2xl bg-amber-100 text-amber-700 shrink-0">
            <Clock className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-amber-900">
              Verification Review Pending with Admin
            </h3>
            <p className="text-xs text-amber-700 leading-relaxed">
              Your KYC documents have been transmitted directly to the FixAround Admin verification queue. Administrators review credentials promptly. You will receive an in-app alert once approved.
            </p>
          </div>
        </div>
      )}

      {isRejected && (
        <div className="p-6 rounded-3xl bg-rose-50 border border-rose-200 flex items-start gap-4 shadow-2xs">
          <div className="p-3 rounded-2xl bg-rose-100 text-rose-700 shrink-0">
            <XCircle className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-rose-900">
              Verification Update: Action Required
            </h3>
            <p className="text-xs text-rose-700 leading-relaxed">
              Your previous submission was not approved. Please review the notes below and re-upload valid, legible documents to reactivate your verification.
            </p>
          </div>
        </div>
      )}

      {/* Document Upload & List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload New Document Form */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Upload className="w-4 h-4 text-fixteal-600" />
            <h3 className="text-xs font-bold text-fixblue-900 uppercase tracking-wider">
              Submit KYC Document
            </h3>
          </div>

          <form onSubmit={handleUploadDocument} className="space-y-4">
            <Select
              label="Document Type"
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              options={[
                { value: 'ID_PROOF', label: 'Government ID (Aadhaar / Voter ID / Passport)' },
                { value: 'ADDRESS_PROOF', label: 'Address Proof (Electricity Bill / Rent Agreement)' },
                { value: 'CERTIFICATION', label: 'Trade Certification / Diploma' },
                { value: 'PHOTO', label: 'Workshop or Equipment Photo' },
              ]}
            />

            <Input
              label="Document Name / Title"
              required
              placeholder="e.g. Aadhaar Card Front & Back"
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
            />

            {/* Upload Method Toggle */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Upload Method</label>
              <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setUploadMode('url')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                    uploadMode === 'url' ? 'bg-white text-fixblue-900 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  Document URL / Cloud Link
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode('file')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                    uploadMode === 'file' ? 'bg-white text-fixblue-900 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  Device File Upload
                </button>
              </div>
            </div>

            {uploadMode === 'url' ? (
              <Input
                label="Document URL / Cloud Drive Link"
                required
                placeholder="https://drive.google.com/file/... or image link"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                helperText="Google Drive, Dropbox, AWS S3, or direct image link."
              />
            ) : (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Select Image or PDF</label>
                <label className="border-2 border-dashed border-slate-200 hover:border-fixteal-500 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-teal-50/30 transition-colors">
                  <Paperclip className="w-6 h-6 text-slate-400 mb-1" />
                  <span className="text-xs font-bold text-slate-700">
                    {fileName || 'Click to select ID photo or document'}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, PDF up to 5MB</span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="md"
              fullWidth
              loading={uploading}
              icon={Upload}
            >
              Submit Document for Admin Review
            </Button>
          </form>
        </div>

        {/* Existing Uploaded Documents */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-xs font-bold text-fixblue-900 uppercase tracking-wider flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-fixteal-600" />
              Submitted Records ({documents.length})
            </h3>
            {hasPendingDocs && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                Review in progress
              </span>
            )}
          </div>

          {documents.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-400 space-y-2">
              <FileText className="w-8 h-8 text-slate-300 mx-auto" />
              <p>No KYC documents submitted yet.</p>
              <p className="text-[11px] text-slate-400">Use the form on the left to upload your verification files.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 space-y-2 text-xs hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-white text-fixblue-800 border border-slate-100 shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{doc.document_name}</p>
                        <span className="text-[10px] text-slate-400 block">
                          {doc.document_type} &bull; {formatDate(doc.created_at)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          doc.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : doc.status === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {doc.status || 'PENDING'}
                      </span>

                      {doc.file_url && (
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-white border border-slate-200 text-fixblue-800 hover:bg-slate-100 transition-colors"
                          title="View Document"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>

                  {doc.notes && (
                    <div className="p-2 rounded-xl bg-white border border-slate-100 text-[11px] text-slate-600">
                      <strong className="text-slate-800">Admin Feedback:</strong> {doc.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
