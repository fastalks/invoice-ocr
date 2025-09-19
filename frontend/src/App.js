import React, { useState } from 'react';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('请先选择发票图片');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8888/api/ocr', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error || '识别失败，请重试');
      }
    } catch (err) {
      setError('网络请求失败，请检查后端服务');
      console.error('API请求错误:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const exportToExcel = () => {
    if (!result) return;
    
    // 简单的CSV导出功能
    const csvContent = Object.entries(result)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return `${key}: ${JSON.stringify(value)}`;
        }
        return `${key}: ${value}`;
      })
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `invoice_${result.invoice_number || 'unknown'}.csv`;
    link.click();
  };

  return (
    <div className="App">
      <div className="container">
        <h1>📄 智能发票识别系统1</h1>
        
        <div className="upload-section">
          <form onSubmit={handleSubmit} className="upload-form">
            <div className="file-input-wrapper">
              <input 
                type="file" 
                id="file-input"
                onChange={handleFileChange} 
                accept="image/*,.pdf,.jpg,.jpeg,.png"
                disabled={loading}
              />
              <label htmlFor="file-input" className="file-label">
                {file ? file.name : '选择发票文件'}
              </label>
            </div>
            
            <button 
              type="submit" 
              className="submit-btn"
              disabled={loading || !file}
            >
              {loading ? '🔍 识别中...' : '🚀 开始识别'}
            </button>
          </form>
        </div>

        {error && (
          <div className="error-message">
            ❌ {error}
          </div>
        )}

        {result && (
          <div className="result-section">
            <div className="result-header">
              <h2>✅ 识别成功</h2>
              <button onClick={exportToExcel} className="export-btn">
                📥 导出数据
              </button>
            </div>

            <div className="result-grid">
              <div className="result-card">
                <h3>基本信息</h3>
                <div className="info-item">
                  <span className="label">发票类型:</span>
                  <span className="value">{result.invoice_type}</span>
                </div>
                <div className="info-item">
                  <span className="label">发票号码:</span>
                  <span className="value">{result.invoice_number}</span>
                </div>
                <div className="info-item">
                  <span className="label">开票日期:</span>
                  <span className="value">{result.invoice_date}</span>
                </div>
              </div>

              <div className="result-card">
                <h3>金额信息</h3>
                <div className="info-item">
                  <span className="label">总金额:</span>
                  <span className="value">¥{result.total_amount}</span>
                </div>
                <div className="info-item">
                  <span className="label">不含税金额:</span>
                  <span className="value">¥{result.amount_without_tax}</span>
                </div>
                <div className="info-item">
                  <span className="label">税额:</span>
                  <span className="value">¥{result.tax_amount}</span>
                </div>
                <div className="info-item">
                  <span className="label">大写金额:</span>
                  <span className="value">{result.amount_in_words}</span>
                </div>
              </div>

              <div className="result-card">
                <h3>销售方信息</h3>
                <div className="info-item">
                  <span className="label">名称:</span>
                  <span className="value">{result.seller_name}</span>
                </div>
                <div className="info-item">
                  <span className="label">税号:</span>
                  <span className="value">{result.seller_tax_id}</span>
                </div>
              </div>

              <div className="result-card">
                <h3>购买方信息</h3>
                <div className="info-item">
                  <span className="label">名称:</span>
                  <span className="value">{result.purchaser_name}</span>
                </div>
                <div className="info-item">
                  <span className="label">税号:</span>
                  <span className="value">{result.purchaser_tax_id}</span>
                </div>
              </div>
            </div>

            {result.items && result.items.length > 0 && (
              <div className="items-section">
                <h3>商品明细</h3>
                <table className="items-table">
                  <thead>
                    <tr>
                      <th>商品名称</th>
                      <th>规格</th>
                      <th>数量</th>
                      <th>单价</th>
                      <th>金额</th>
                      <th>税率</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.items.map((item, index) => (
                      <tr key={index}>
                        <td>{item.name}</td>
                        <td>{item.spec}</td>
                        <td>{item.quantity}</td>
                        <td>¥{item.unit_price}</td>
                        <td>¥{item.amount}</td>
                        <td>{item.tax_rate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;