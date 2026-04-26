import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import * as XLSX from 'xlsx';
import './ReportForm.css';

interface ReportItem {
  id?: number;
  type: 'INCOME' | 'EXPENSE';
  month: string;
  description: string;
  amount: number;
}

const ReportForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const [startMonth, setStartMonth] = useState('');
  const [endMonth, setEndMonth] = useState('');
  
  const [incomeItems, setIncomeItems] = useState<ReportItem[]>([
    { type: 'INCOME', month: '', description: '', amount: 0 }
  ]);
  const [expenseItems, setExpenseItems] = useState<ReportItem[]>([
    { type: 'EXPENSE', month: '', description: '', amount: 0 }
  ]);

  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);

  useEffect(() => {
    if (isEditMode) {
      const savedReports = localStorage.getItem('choir-reports');
      if (savedReports) {
        const reports = JSON.parse(savedReports);
        const report = reports.find((r: any) => r.id === Number(id));
        if (report) {
          const inc = report.items.filter((i: any) => i.type === 'INCOME');
          const exp = report.items.filter((i: any) => i.type === 'EXPENSE');
          setIncomeItems(inc.length > 0 ? inc : [{ type: 'INCOME', month: '', description: '', amount: 0 }]);
          setExpenseItems(exp.length > 0 ? exp : [{ type: 'EXPENSE', month: '', description: '', amount: 0 }]);
        }
      }
    }
  }, [id, isEditMode]);

  useEffect(() => {
    const incSum = incomeItems.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
    const expSum = expenseItems.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
    setTotalIncome(incSum);
    setTotalExpense(expSum);
  }, [incomeItems, expenseItems]);

  const formatNumber = (num: number) => new Intl.NumberFormat('ko-KR').format(num);

  const getTitlePeriod = () => {
    if (!startMonth || !endMonth) return "0000년 0월 ~ 0000년 0월 결산보고";
    const [y1, m1] = startMonth.split('-');
    const [y2, m2] = endMonth.split('-');
    return `${y1}년 ${parseInt(m1, 10)}월 ~ ${y2}년 ${parseInt(m2, 10)}월 결산보고`;
  };

  const handleItemChange = (type: 'INCOME' | 'EXPENSE', index: number, field: keyof ReportItem, value: any) => {
    const isIncome = type === 'INCOME';
    const items = isIncome ? [...incomeItems] : [...expenseItems];
    if (field === 'amount') {
      const numericValue = String(value).replace(/\D/g, '');
      value = numericValue ? parseInt(numericValue, 10) : 0;
    }
    items[index] = { ...items[index], [field]: value };
    isIncome ? setIncomeItems(items) : setExpenseItems(items);
  };

  const addItem = (type: 'INCOME' | 'EXPENSE') => {
    const newItem: ReportItem = { type, month: '', description: '', amount: 0 };
    if (type === 'INCOME') setIncomeItems([...incomeItems, newItem]);
    else setExpenseItems([...expenseItems, newItem]);
  };

  const removeItem = (type: 'INCOME' | 'EXPENSE', index: number) => {
    const isIncome = type === 'INCOME';
    const items = isIncome ? incomeItems : expenseItems;
    if (items.length > 1) {
      const filtered = items.filter((_, i) => i !== index);
      isIncome ? setIncomeItems(filtered) : setExpenseItems(filtered);
    }
  };

  const handlePrint = () => window.print();

  const handleExportExcel = () => {
    const data: any[] = [['성토마 성가대'], [getTitlePeriod()], []];
    data.push(['[ 수 입 ]'], ['월', '내역', '금액']);
    incomeItems.forEach(item => data.push([item.month, item.description, item.amount]));
    data.push(['총 수입', '', totalIncome], []);
    data.push(['[ 지 출 ]'], ['월', '내역', '금액']);
    expenseItems.forEach(item => data.push([item.month, item.description, item.amount]));
    data.push(['총 지출', '', totalExpense], [], ['누계', '', totalIncome - totalExpense]);

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "결산보고");
    XLSX.writeFile(wb, `${getTitlePeriod()}.xlsx`);
  };

  return (
    <div id="report-wrapper">
      <div className="no-print header-actions">
        <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
          <button className="btn" style={{ background: '#3498db', color: 'white' }} onClick={handleExportExcel}>📊 엑셀 다운로드</button>
          <button className="btn" style={{ background: '#9b59b6', color: 'white' }} onClick={handlePrint}>🖨️ PDF 인쇄</button>
        </div>
      </div>

      <div className="report-container">
        <div className="report-header">
          <h1 className="report-title">성토마스 성가대</h1>
          <div className="report-period">
            {getTitlePeriod()}
            <div className="period-inputs no-print" style={{ fontSize: '12px', marginTop: '10px' }}>
              기간 선택: <input type="month" value={startMonth} onChange={(e) => setStartMonth(e.target.value)} />
              ~ <input type="month" value={endMonth} onChange={(e) => setEndMonth(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="report-content">
          <div className="table-section">
            <h3>수 입</h3>
            <table>
              <thead>
                <tr>
                  <th style={{ width: '18%' }}>월</th>
                  <th style={{ width: '57%' }}>내역</th>
                  <th style={{ width: '25%' }}>금액 (원)</th>
                </tr>
              </thead>
              <tbody>
                {incomeItems.map((item, index) => (
                  <tr key={`inc-${index}`}>
                    <td><input type="text" value={item.month} onChange={(e) => handleItemChange('INCOME', index, 'month', e.target.value)} /></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <input type="text" value={item.description} onChange={(e) => handleItemChange('INCOME', index, 'description', e.target.value)} />
                        <button className="btn-remove no-print" onClick={() => removeItem('INCOME', index)}>×</button>
                      </div>
                    </td>
                    <td><input type="text" className="amount-input" value={formatNumber(item.amount)} onChange={(e) => handleItemChange('INCOME', index, 'amount', e.target.value)} /></td>
                  </tr>
                ))}
                <tr className="no-print">
                  <td colSpan={3}><button className="btn-add" onClick={() => addItem('INCOME')}>+ 항목 추가</button></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="table-section">
            <h3>지 출</h3>
            <table>
              <thead>
                <tr>
                  <th style={{ width: '18%' }}>월</th>
                  <th style={{ width: '57%' }}>내역</th>
                  <th style={{ width: '25%' }}>금액 (원)</th>
                </tr>
              </thead>
              <tbody>
                {expenseItems.map((item, index) => (
                  <tr key={`exp-${index}`}>
                    <td><input type="text" value={item.month} onChange={(e) => handleItemChange('EXPENSE', index, 'month', e.target.value)} /></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <input type="text" value={item.description} onChange={(e) => handleItemChange('EXPENSE', index, 'description', e.target.value)} />
                        <button className="btn-remove no-print" onClick={() => removeItem('EXPENSE', index)}>×</button>
                      </div>
                    </td>
                    <td><input type="text" className="amount-input" value={formatNumber(item.amount)} onChange={(e) => handleItemChange('EXPENSE', index, 'amount', e.target.value)} /></td>
                  </tr>
                ))}
                <tr className="no-print">
                  <td colSpan={3}><button className="btn-add" onClick={() => addItem('EXPENSE')}>+ 항목 추가</button></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="report-summary-bar">
          <div className="summary-item income">
            <span className="label">총 수입 :</span>
            <span className="value">{formatNumber(totalIncome)} 원</span>
          </div>
          <div className="summary-item expense">
            <span className="label">총 지출 :</span>
            <span className="value">{formatNumber(totalExpense)} 원</span>
          </div>
          <div className="summary-item balance">
            <span className="label">누 계 :</span>
            <span className="value">{formatNumber(totalIncome - totalExpense)} 원</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportForm;
