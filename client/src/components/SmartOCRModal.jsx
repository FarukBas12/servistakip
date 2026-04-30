import React, { useState, useEffect } from 'react';
import { X, Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2, Image as ImageIcon } from 'lucide-react';
import * as XLSX from 'xlsx';

const SmartOCRModal = ({ onClose }) => {
    const [imageFile, setImageFile] = useState(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analyzedData, setAnalyzedData] = useState([]);
    
    // Clean up preview URL when component unmounts
    useEffect(() => {
        return () => {
            if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
        };
    }, [imagePreviewUrl]);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setImageFile(file);
        
        // Create preview URL
        const objectUrl = URL.createObjectURL(file);
        setImagePreviewUrl(objectUrl);
        
        // Reset previous data
        setAnalyzedData([]);
        
        // Simulate OCR process
        simulateOCR();
    };

    const simulateOCR = () => {
        setIsAnalyzing(true);
        
        // Simulate a 2.5 second API call
        setTimeout(() => {
            setIsAnalyzing(false);
            // Mock data based on the user's handwritten image
            setAnalyzedData([
                { id: 1, category: 'Merdiven 3-4 sac', dim1: '125', dim2: '47', dim3: '12', multiplier: '', total: calculateRowTotal('125', '47', '12', ''), isMissingData: false },
                { id: 2, category: 'Merdiven 3-4 sac', dim1: '84', dim2: '164', dim3: '', multiplier: '', total: calculateRowTotal('84', '164', '', ''), isMissingData: false },
                { id: 3, category: '8mm mdf kaplama', dim1: '168', dim2: '183', dim3: '', multiplier: '', total: calculateRowTotal('168', '183', '', ''), isMissingData: false },
                { id: 4, category: '8mm mdf kaplama', dim1: '56', dim2: '', dim3: '', multiplier: '', total: 0, isMissingData: true }, // Missing dimension example
                { id: 5, category: '40x80x3 mm', dim1: '230', dim2: '', dim3: '', multiplier: '2', total: calculateRowTotal('230', '', '', '2'), isMissingData: false },
                { id: 6, category: 'Güvenlik çiti', dim1: '500', dim2: '200', dim3: '', multiplier: '', total: calculateRowTotal('500', '200', '', ''), isMissingData: false },
            ]);
        }, 2500);
    };

    // Calculate total for a row
    const calculateRowTotal = (d1, d2, d3, mult) => {
        const parseNum = (val) => {
            if (!val || val.trim() === '') return 1;
            const num = parseFloat(val.replace(',', '.'));
            return isNaN(num) ? 1 : num;
        };

        let result = 1;
        let hasValues = false;

        if (d1 && d1.trim() !== '') { result *= parseNum(d1); hasValues = true; }
        if (d2 && d2.trim() !== '') { result *= parseNum(d2); hasValues = true; }
        if (d3 && d3.trim() !== '') { result *= parseNum(d3); hasValues = true; }
        if (mult && mult.trim() !== '') { result *= parseNum(mult); hasValues = true; }

        return hasValues ? result : 0;
    };

    const handleRowChange = (id, field, value) => {
        setAnalyzedData(prevData => prevData.map(row => {
            if (row.id === id) {
                const updatedRow = { ...row, [field]: value };
                
                // Recalculate total if dimensions changed
                if (['dim1', 'dim2', 'dim3', 'multiplier'].includes(field)) {
                    updatedRow.total = calculateRowTotal(updatedRow.dim1, updatedRow.dim2, updatedRow.dim3, updatedRow.multiplier);
                    
                    // Basic validation to clear "missing data" warning if we now have a valid calculation
                    if (updatedRow.isMissingData && updatedRow.total > 0 && updatedRow.dim2 !== '') {
                        updatedRow.isMissingData = false;
                    }
                }
                
                return updatedRow;
            }
            return row;
        }));
    };

    const exportToExcel = () => {
        if (analyzedData.length === 0) return;

        // Map data to the format we want in Excel
        const excelData = analyzedData.map((row, index) => ({
            'Sıra': index + 1,
            'Kategori / Kalem': row.category,
            'Ebat 1': row.dim1,
            'Ebat 2': row.dim2,
            'Ebat 3': row.dim3,
            'Adet / Çarpan': row.multiplier,
            'Toplam Metraj / Miktar': row.total
        }));

        // Create a new workbook
        const wb = XLSX.utils.book_new();
        
        // Convert JSON to worksheet
        const ws = XLSX.utils.json_to_sheet(excelData);
        
        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, "Hakediş Verileri");
        
        // Download the file
        XLSX.writeFile(wb, `Hakedis_OCR_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    // Calculate grand total for display
    const grandTotal = analyzedData.reduce((sum, row) => sum + (Number(row.total) || 0), 0);

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.9)', 
            backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', 
            justifyContent: 'center', zIndex: 9999, padding: '20px'
        }}>
            <div className="glass-panel" style={{
                width: '100%', maxWidth: '1400px', height: '90vh', 
                display: 'flex', flexDirection: 'column', 
                background: 'rgba(30, 41, 59, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px', overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px 30px', borderBottom: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'rgba(15, 23, 42, 0.5)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '10px',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <ImageIcon size={20} color="white" />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#f8fafc' }}>Görselden Excel'e (OCR Asistanı)</h2>
                            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>El yazısı defter fotoğraflarını anında hesaplayın ve Excel'e aktarın.</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="glass-btn" style={{ padding: '8px', borderRadius: '50%' }}>
                        <X size={20} />
                    </button>
                </div>

                {/* Main Content Body */}
                <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                    
                    {/* Left Column - Image Preview */}
                    <div style={{
                        flex: '0 0 40%', borderRight: '1px solid rgba(255,255,255,0.05)',
                        display: 'flex', flexDirection: 'column', padding: '20px',
                        background: 'rgba(15, 23, 42, 0.3)'
                    }}>
                        {!imagePreviewUrl ? (
                            <div style={{
                                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                                justifyContent: 'center', border: '2px dashed rgba(148, 163, 184, 0.3)',
                                borderRadius: '12px', background: 'rgba(30, 41, 59, 0.5)', cursor: 'pointer'
                            }} onClick={() => document.getElementById('ocr-file-upload').click()}>
                                <Upload size={48} color="#64748b" style={{ marginBottom: '15px' }} />
                                <h3 style={{ color: '#e2e8f0', marginBottom: '5px' }}>Defter Fotoğrafı Yükle</h3>
                                <p style={{ color: '#94a3b8', fontSize: '0.9rem', textAlign: 'center', maxWidth: '80%' }}>
                                    Hakediş notlarınızı içeren kağıdın fotoğrafını seçin veya sürükleyip bırakın.
                                </p>
                                <input 
                                    id="ocr-file-upload" 
                                    type="file" 
                                    accept="image/*" 
                                    hidden 
                                    onChange={handleFileSelect} 
                                />
                                <button className="glass-btn" style={{ marginTop: '20px', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', borderColor: 'rgba(59, 130, 246, 0.3)' }}>
                                    Bilgisayardan Seç
                                </button>
                            </div>
                        ) : (
                            <div style={{ flex: 1, position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <img src={imagePreviewUrl} alt="Document preview" style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }} />
                                <button 
                                    onClick={() => document.getElementById('ocr-file-upload').click()}
                                    className="glass-btn" 
                                    style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(4px)' }}
                                >
                                    Değiştir
                                </button>
                                <input id="ocr-file-upload" type="file" accept="image/*" hidden onChange={handleFileSelect} />
                            </div>
                        )}
                    </div>

                    {/* Right Column - Data Table */}
                    <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        
                        {isAnalyzing ? (
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                <Loader2 size={50} color="#3b82f6" style={{ animation: 'spin 2s linear infinite', marginBottom: '20px' }} />
                                <h3 style={{ color: '#e2e8f0' }}>Yapay Zeka Okuyor...</h3>
                                <p style={{ color: '#94a3b8' }}>El yazıları çözümleniyor ve hesaplamalar yapılıyor.</p>
                            </div>
                        ) : analyzedData.length === 0 ? (
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                                <FileSpreadsheet size={64} color="#64748b" style={{ marginBottom: '20px' }} />
                                <p style={{ color: '#94a3b8', fontSize: '1.1rem' }}>Sonuçları görmek için bir fotoğraf yükleyin.</p>
                            </div>
                        ) : (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                    <h3 style={{ margin: 0, color: '#e2e8f0' }}>Analiz Sonuçları</h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4caf50', fontSize: '0.9rem', background: 'rgba(76, 175, 80, 0.1)', padding: '6px 12px', borderRadius: '20px', border: '1px solid rgba(76, 175, 80, 0.2)' }}>
                                        <CheckCircle size={16} /> Tarama Başarılı
                                    </div>
                                </div>
                                
                                <div style={{ flex: 1, overflowY: 'auto', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                        <thead style={{ position: 'sticky', top: 0, background: 'rgba(30, 41, 59, 0.95)', backdropFilter: 'blur(4px)', zIndex: 10 }}>
                                            <tr>
                                                <th style={{ padding: '15px', color: '#94a3b8', fontWeight: '500', fontSize: '0.9rem' }}>Kategori / Kalem</th>
                                                <th style={{ padding: '15px', color: '#94a3b8', fontWeight: '500', fontSize: '0.9rem', width: '80px' }}>Ebat 1</th>
                                                <th style={{ padding: '15px', color: '#94a3b8', fontWeight: '500', fontSize: '0.9rem', width: '80px' }}>Ebat 2</th>
                                                <th style={{ padding: '15px', color: '#94a3b8', fontWeight: '500', fontSize: '0.9rem', width: '80px' }}>Ebat 3</th>
                                                <th style={{ padding: '15px', color: '#94a3b8', fontWeight: '500', fontSize: '0.9rem', width: '80px' }}>Çarpan</th>
                                                <th style={{ padding: '15px', color: '#94a3b8', fontWeight: '500', fontSize: '0.9rem', textAlign: 'right' }}>Toplam</th>
                                                <th style={{ padding: '15px', color: '#94a3b8', fontWeight: '500', fontSize: '0.9rem', width: '50px', textAlign: 'center' }}>Durum</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {analyzedData.map(row => (
                                                <tr key={row.id} style={{ 
                                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                                    background: row.isMissingData ? 'rgba(245, 158, 11, 0.05)' : 'transparent'
                                                }}>
                                                    <td style={{ padding: '10px' }}>
                                                        <input 
                                                            className="glass-input" 
                                                            value={row.category} 
                                                            onChange={(e) => handleRowChange(row.id, 'category', e.target.value)}
                                                            style={{ width: '100%', border: 'none', background: 'transparent' }} 
                                                        />
                                                    </td>
                                                    <td style={{ padding: '10px' }}>
                                                        <input className="glass-input" value={row.dim1} onChange={(e) => handleRowChange(row.id, 'dim1', e.target.value)} style={{ width: '100%', textAlign: 'center', padding: '8px 5px', border: row.isMissingData && !row.dim1 ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid rgba(255,255,255,0.1)' }} />
                                                    </td>
                                                    <td style={{ padding: '10px' }}>
                                                        <input className="glass-input" value={row.dim2} onChange={(e) => handleRowChange(row.id, 'dim2', e.target.value)} style={{ width: '100%', textAlign: 'center', padding: '8px 5px', border: row.isMissingData && !row.dim2 ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid rgba(255,255,255,0.1)' }} />
                                                    </td>
                                                    <td style={{ padding: '10px' }}>
                                                        <input className="glass-input" value={row.dim3} onChange={(e) => handleRowChange(row.id, 'dim3', e.target.value)} style={{ width: '100%', textAlign: 'center', padding: '8px 5px' }} />
                                                    </td>
                                                    <td style={{ padding: '10px' }}>
                                                        <input className="glass-input" value={row.multiplier} onChange={(e) => handleRowChange(row.id, 'multiplier', e.target.value)} style={{ width: '100%', textAlign: 'center', padding: '8px 5px' }} />
                                                    </td>
                                                    <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: '#e2e8f0', fontSize: '1.1rem' }}>
                                                        {row.total.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}
                                                    </td>
                                                    <td style={{ padding: '10px', textAlign: 'center' }}>
                                                        {row.isMissingData ? (
                                                            <div title="Eksik Veri (Çarpan Giriniz)" style={{ color: '#f59e0b', display: 'flex', justifyContent: 'center' }}>
                                                                <AlertCircle size={20} />
                                                            </div>
                                                        ) : (
                                                            <div title="Hesaplandı" style={{ color: '#4caf50', display: 'flex', justifyContent: 'center' }}>
                                                                <CheckCircle size={20} />
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                
                                {/* Bottom Action Bar */}
                                <div style={{ 
                                    marginTop: '20px', padding: '20px', 
                                    background: 'rgba(15, 23, 42, 0.6)', 
                                    borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                }}>
                                    <div>
                                        <span style={{ color: '#94a3b8', fontSize: '0.9rem', display: 'block', marginBottom: '5px' }}>Genel Toplam Metraj/Miktar</span>
                                        <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#f8fafc' }}>
                                            {grandTotal.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    
                                    <div style={{ display: 'flex', gap: '15px' }}>
                                        <button className="glass-btn" onClick={() => {
                                            if (window.confirm('Verileri temizlemek istediğinize emin misiniz?')) {
                                                setAnalyzedData([]);
                                                setImageFile(null);
                                                setImagePreviewUrl(null);
                                            }
                                        }}>
                                            Temizle
                                        </button>
                                        <button 
                                            onClick={exportToExcel}
                                            className="glass-btn" 
                                            style={{ 
                                                background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', 
                                                border: 'none', padding: '12px 24px', 
                                                display: 'flex', alignItems: 'center', gap: '8px',
                                                fontSize: '1.05rem', fontWeight: 'bold',
                                                boxShadow: '0 4px 15px rgba(22, 163, 74, 0.3)'
                                            }}
                                        >
                                            <FileSpreadsheet size={22} /> Excel Olarak İndir
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SmartOCRModal;
