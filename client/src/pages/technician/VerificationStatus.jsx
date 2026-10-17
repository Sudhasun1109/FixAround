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
} from 'lucide-react';

export default function VerificationStatus() {
  const { user, updateUser } = useAuth();

  const [techProfile, setTechProfile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Upload Form
  const [docType, setDocType] = useState('ID_PROOF');
  const [docName, setDocName] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const fetchProfileAndDocs = useCallback(async () => {
    try {
      setLoading(true);
      const [pRes, dRes] = await Promise.all([
        techniciansApi.getById(user?.id).catch(() => ({ data: null })),
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

  const handleUploadDocument = async (e) => {
    e.preventDefault();
    if (!docName.trim() || !fileUrl.trim()) {
      showToast.error('Please specify document title and URL');
      return;
    }

    try {
      setUploading(true);
      await techniciansApi.uploadDocument({
        document_type: docType,
        document_name: docName.trim(),
        file_url: fileUrl.trim(),
      });

      showToast.success('Document uploaded for verification review.');
      setDocName('');
      setFileUrl('');
      fetchProfileAndDocs();
    } catch (err) {
      showToast.error(err.message || 'Failed to submit document');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <Spinner fullScreen label="Checking KYC verification status..." />;
  }

  const status = techProfile?.verification_status || user?.verification_status || 'pending';
  const isApproved = status === 'approved';
  const isPending = status === 'pending';
  const isRejected = status === 'rejected';

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4">
      <div>
        <span className="text-xs font-bold text-fixteal-600 uppercase tracking-wider">
          KYC & Compliance
        </span>
        <h1 className="text-2xl font-extrabold text-fixblue-900 mt-0.5">
          Identity & Trade Verification
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Government ID and trade licensing verification to unlock public dispatch requests.
        </p>
      </div>

      {/* Status Banner */}
      {isApproved && (
        <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-200 flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-700 shrink-0">
            <CheckCircle className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-emerald-900">
              Account Verified & Fully Authorized
            </h3>
            <p className="text-xs text-emerald-700 leading-relaxed">
              Your credentials, government identity, and trade background check have been approved by FixAround Administration. You have priority access to standard and emergency repair jobs.
            </p>
          </div>
        </div>
      )}

      {isPending && (
        <div className="p-6 rounded-3xl bg-amber-50 border border-amber-200 flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-amber-100 text-amber-700 shrink-0">
            <Clock className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-amber-900">
              Verification Review Pending
            </h3>
            <p className="text-xs text-amber-700 leading-relaxed">
              Your application documents are currently queued for administrator review. Our compliance team verifies government IDs and credentials within 24 to 48 hours.
            </p>
          </div>
        </div>
      )}

      {isRejected && (
        <div className="p-6 rounded-3xl bg-rose-50 border border-rose-200 flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-rose-100 text-rose-700 shrink-0">
            <XCircle className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-rose-900">
              Document Verification Unsuccessful
            </h3>
            <p className="text-xs text-rose-700 leading-relaxed">
              Please re-upload clear copies of your valid government ID proof and trade certifications below to reactivate your application.
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
              Upload Verification Document
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

            <Input
              label="File URL / Scanned Document Link"
              required
              placeholder="https://example.com/scanned-id.pdf"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              helperText="Provide a secure hosted image or PDF URL."
            />

            <Button
              type="submit"
              variant="primary"
              size="md"
              fullWidth
              loading={uploading}
              icon={Upload}
            >
              Submit Document for Review
            </Button>
          </form>
        </div>

        {/* Existing Uploaded Documents */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-fixblue-900 uppercase tracking-wider pb-3 border-b border-slate-100">
            Submitted KYC Records ({documents.length})
          </h3>

          {documents.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              No verification documents submitted yet. Use the upload form on the left.
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-fixblue-800 shrink-0" />
                    <div>
                      <p className="font-bold text-slate-800">{doc.document_name}</p>
                      <span className="text-[10px] text-slate-400">{doc.document_type}</span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      doc.status === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : doc.status === 'REJECTED'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {doc.status || 'PENDING'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
