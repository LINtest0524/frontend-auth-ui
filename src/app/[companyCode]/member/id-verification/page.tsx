'use client';

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_BASE;

type StatusType = 'PENDING' | 'APPROVED' | 'REJECTED' | null;

export default function IDVerificationPage() {
  const [front, setFront] = useState<File | string | null>(null);
  const [back, setBack] = useState<File | string | null>(null);
  const [selfie, setSelfie] = useState<File | string | null>(null);

  const frontRef = useRef<HTMLInputElement | null>(null);
  const backRef = useRef<HTMLInputElement | null>(null);
  const selfieRef = useRef<HTMLInputElement | null>(null);

  const [status, setStatus] = useState<StatusType>(null);
  const [note, setNote] = useState<string | null>(null);
  const [previewKey, setPreviewKey] = useState(0);

  const params = useParams();
  const companyCode = params.companyCode as string || 'a';

  // 動態獲取當前公司代碼的token
  const token = typeof window !== 'undefined' ? (() => {
    return localStorage.getItem(`portalToken_${companyCode}`)
  })() : null;

  const fetchStatus = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_URL}/api/id-verification/me?type=ID_CARD`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = res.data;

      if (data) {
        setStatus(data.status);
        setNote(data.note ?? null);

        if (data.images && Array.isArray(data.images)) {
          setFront(data.images[0] || null);
          setBack(data.images[1] || null);
          setSelfie(data.images[2] || null);
        } else {
          console.warn('沒有 images 資料');
        }
      }
    } catch (err) {
      // 查詢身份驗證狀態失敗，靜默處理
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [token]);

  const handleFileChange = (type: 'front' | 'back' | 'selfie', file: File | null) => {
    switch (type) {
      case 'front':
        setFront(file);
        break;
      case 'back':
        setBack(file);
        break;
      case 'selfie':
        setSelfie(file);
        break;
    }
  };

  const clearFile = (type: 'front' | 'back' | 'selfie') => {
    switch (type) {
      case 'front':
        setFront(null);
        if (frontRef.current) frontRef.current.value = '';
        break;
      case 'back':
        setBack(null);
        if (backRef.current) backRef.current.value = '';
        break;
      case 'selfie':
        setSelfie(null);
        if (selfieRef.current) selfieRef.current.value = '';
        break;
    }
    setPreviewKey(prev => prev + 1);
  };

  const handleSubmit = async () => {
    if (!front || !back || !selfie) {
      alert('請選擇所有圖片');
      return;
    }

    const formData = new FormData();
    formData.append('files', front as File);
    formData.append('files', back as File);
    formData.append('files', selfie as File);
    formData.append('type', 'ID_CARD');

    try {
      const res = await axios.post(`${API_URL}/api/id-verification`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      alert(res.data.message || '已送出審核，請耐心等待客服審核');
      await fetchStatus(); // 重抓資料
      
      // 清空 input
      if (frontRef.current) frontRef.current.value = '';
      if (backRef.current) backRef.current.value = '';
      if (selfieRef.current) selfieRef.current.value = '';
      setPreviewKey((prev) => prev + 1);
    } catch (err) {
      console.error('提交失敗:', err);
      alert('上傳失敗，請稍後再試');
    }
  };

  const handleReset = async () => {
    try {
      await axios.delete(`${API_URL}/api/id-verification?type=ID_CARD`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setFront(null);
      setBack(null);
      setSelfie(null);
      setStatus(null);
      setNote(null);
      setPreviewKey((prev) => prev + 1);

      if (frontRef.current) frontRef.current.value = '';
      if (backRef.current) backRef.current.value = '';
      if (selfieRef.current) selfieRef.current.value = '';

      alert('資料已清除，請重新上傳');
    } catch (err) {
      console.error('清除失敗:', err);
      alert('清除失敗，請稍後再試');
    }
  };

  const getImageSrc = (file: File | string | null) => {
    if (!file) return null;
    if (typeof file === 'string') {
      return file.startsWith('http') ? file : `${API_URL}${file}`;
    }
    return URL.createObjectURL(file);
  };

  const getStatusColor = (status: StatusType) => {
    switch (status) {
      case 'PENDING': return 'orange';
      case 'APPROVED': return 'green';
      case 'REJECTED': return 'red';
      default: return 'gray';
    }
  };

  const getStatusText = (status: StatusType) => {
    switch (status) {
      case 'PENDING': return '審核中';
      case 'APPROVED': return '已通過';
      case 'REJECTED': return '已拒絕';
      default: return '未提交';
    }
  };

  const renderPreview = (file: File | string | null) => {
    if (!file) return null;
    const url = getImageSrc(file);
    if (!url) return null;
    return (
      <div className="id-upload-preview">
        <img
          key={`${previewKey}-${url}`}
          src={url}
          alt="preview"
        />
      </div>
    );
  };

  const isDisabled = status === 'PENDING' || status === 'APPROVED';

  return (
    <div className="id-verification-container">
      <div className="id-verification-header">
        <h1 className="id-verification-title">
          <div className="id-verification-icon">🆔</div>
          身份證驗證
        </h1>
      </div>

      <div className="id-verification-content">
        {/* 使用說明 */}
        <div className="id-verification-instructions">
          <h3>📋 驗證說明</h3>
          <ul>
            <li>請上傳清晰的身份證正面、反面照片</li>
            <li>請手持身份證拍攝自拍照，確保臉部和身份證都清楚可見</li>
            <li>照片格式支援 JPG、PNG 等常見圖片格式</li>
            <li>審核時間約 2 個小時，請耐心等待</li>
          </ul>
        </div>

        {/* 狀態顯示 */}
        {status === 'PENDING' && (
          <div className="id-verification-status pending">
            <div className="id-verification-status-icon">⏳</div>
            已送出審核，請耐心等待客服審核
          </div>
        )}
        {status === 'APPROVED' && (
          <div className="id-verification-status approved">
            <div className="id-verification-status-icon">✅</div>
            已通過身份驗證
          </div>
        )}
        {status === 'REJECTED' && (
          <div className="id-verification-status rejected">
            <div className="id-verification-status-icon">❌</div>
            驗證未通過：{note || '資料有誤，請重新上傳'}
          </div>
        )}

        {status !== 'REJECTED' && (
          <>
            <div className="id-upload-section">
              <div className={`id-upload-item ${front ? 'has-file' : ''} ${isDisabled ? 'id-upload-disabled' : ''}`}>
                <div className="id-upload-label">
                  <span className="id-upload-icon">📄</span>
                  身份證正面
                </div>
                {renderPreview(front)}
                {!isDisabled && (
                  <input
                    ref={frontRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange('front', e.target.files?.[0] || null)}
                    className="id-upload-input"
                  />
                )}
              </div>

              <div className={`id-upload-item ${back ? 'has-file' : ''} ${isDisabled ? 'id-upload-disabled' : ''}`}>
                <div className="id-upload-label">
                  <span className="id-upload-icon">📄</span>
                  身份證反面
                </div>
                {renderPreview(back)}
                {!isDisabled && (
                  <input
                    ref={backRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange('back', e.target.files?.[0] || null)}
                    className="id-upload-input"
                  />
                )}
              </div>

              <div className={`id-upload-item ${selfie ? 'has-file' : ''} ${isDisabled ? 'id-upload-disabled' : ''}`}>
                <div className="id-upload-label">
                  <span className="id-upload-icon">🤳</span>
                  手持身份證自拍
                </div>
                {renderPreview(selfie)}
                {!isDisabled && (
                  <input
                    ref={selfieRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange('selfie', e.target.files?.[0] || null)}
                    className="id-upload-input"
                  />
                )}
              </div>
            </div>

            <div className="id-verification-actions">
              {!isDisabled && (
                <button
                  onClick={handleSubmit}
                  className="id-verification-btn primary"
                  disabled={!front || !back || !selfie}
                >
                  📤 送出審核
                </button>
              )}
            </div>
          </>
        )}

        {status === 'REJECTED' && (
          <div className="id-verification-actions">
            <button
              onClick={handleReset}
              className="id-verification-btn danger"
            >
              🔄 重新驗證
            </button>
          </div>
        )}
      </div>
    </div>
  );
}