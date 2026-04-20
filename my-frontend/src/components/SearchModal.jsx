// SearchModalEnhanced.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaSearch, FaTimes, FaUserTie, FaUser, FaFileContract, FaBook, FaChartLine } from 'react-icons/fa';
import { getCombinedSearchIndex } from '../services/searchService';
import './SearchModal.css';

const SearchModalEnhanced = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Tạo search index
  const searchIndex = useMemo(() => getCombinedSearchIndex(), []);

  // Thuật toán tìm kiếm fuzzy nâng cao
  const advancedFuzzySearch = useCallback((searchQuery, text, exactMatch = false) => {
    if (!searchQuery || !text) return 0;
    
    const searchTerm = searchQuery.toLowerCase();
    const targetText = text.toLowerCase();
    
    if (exactMatch) {
      return targetText.includes(searchTerm) ? 1 : 0;
    }
    
    // 1. Kiểm tra exact match
    if (targetText.includes(searchTerm)) {
      // Ưu tiên cao hơn nếu match từ đầu
      if (targetText.startsWith(searchTerm)) {
        return 1.0;
      }
      // Match ở giữa
      return 0.9;
    }
    
    // 2. Kiểm tra từng từ
    const searchWords = searchTerm.split(/\s+/);
    const textWords = targetText.split(/\s+/);
    
    let maxScore = 0;
    
    for (const searchWord of searchWords) {
      for (const textWord of textWords) {
        // Kiểm tra partial match (ví dụ: "gv" match với "giangvien")
        if (textWord.includes(searchWord) && searchWord.length >= 2) {
          const score = searchWord.length / textWord.length;
          maxScore = Math.max(maxScore, score * 0.8);
        }
        
        // Kiểm tra fuzzy match với Levenshtein
        const distance = levenshteinDistance(searchWord, textWord);
        const maxLen = Math.max(searchWord.length, textWord.length);
        const similarity = 1 - distance / maxLen;
        
        if (similarity > 0.6) {
          maxScore = Math.max(maxScore, similarity * 0.7);
        }
      }
    }
    
    // 3. Kiểm tra ký tự cuối (cho phép gõ từ cuối)
    if (searchTerm.length >= 2) {
      if (targetText.endsWith(searchTerm)) {
        maxScore = Math.max(maxScore, 0.85);
      }
      
      // Kiểm tra substring bất kỳ
      if (targetText.includes(searchTerm)) {
        const position = targetText.indexOf(searchTerm);
        const positionScore = 1 - (position / targetText.length);
        maxScore = Math.max(maxScore, positionScore * 0.75);
      }
    }
    
    return maxScore;
  }, []);

  // Tính khoảng cách Levenshtein
  const levenshteinDistance = (a, b) => {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[b.length][a.length];
  };

  // Hàm tìm kiếm chính
  const performSearch = useCallback((searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    
    const keywords = searchQuery.toLowerCase().trim().split(/\s+/);
    const scoredResults = [];
    
    for (const item of searchIndex) {
      let totalScore = 0;
      let matchDetails = [];
      
      // Tìm kiếm trong title (ưu tiên cao nhất)
      const titleScore = advancedFuzzySearch(searchQuery, item.title, false);
      if (titleScore > 0) {
        totalScore += titleScore * 100;
        matchDetails.push(`title: ${titleScore * 100}`);
      }
      
      // Tìm kiếm trong subtitle
      if (item.subtitle) {
        const subtitleScore = advancedFuzzySearch(searchQuery, item.subtitle, false);
        if (subtitleScore > 0) {
          totalScore += subtitleScore * 80;
          matchDetails.push(`subtitle: ${subtitleScore * 80}`);
        }
      }
      
      // Tìm kiếm trong content
      const contentScore = advancedFuzzySearch(searchQuery, item.content, false);
      if (contentScore > 0) {
        totalScore += contentScore * 50;
        matchDetails.push(`content: ${contentScore * 50}`);
      }
      
      // Tìm kiếm trong keywords
      for (const keyword of item.keywords) {
        const keywordScore = advancedFuzzySearch(searchQuery, keyword, false);
        if (keywordScore > 0.5) {
          totalScore += keywordScore * 60;
          matchDetails.push(`keyword: ${keywordScore * 60}`);
          break;
        }
      }
      
      // Bonus cho các từ khóa đặc biệt
      if (searchQuery.length <= 3 && item.title.toLowerCase().includes(searchQuery)) {
        totalScore += 30; // Bonus cho search ngắn
      }
      
      if (totalScore > 0) {
        scoredResults.push({
          ...item,
          score: totalScore,
          matchDetails: matchDetails.join(', ')
        });
      }
    }
    
    // Sắp xếp và lấy top 15 kết quả
    const sorted = scoredResults
      .sort((a, b) => b.score - a.score)
      .slice(0, 15);
    
    setResults(sorted);
    setSelectedIndex(sorted.length > 0 ? 0 : -1);
    setIsLoading(false);
  }, [searchIndex, advancedFuzzySearch]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 200);
    
    return () => clearTimeout(timer);
  }, [query, performSearch]);

  // Handle select
  const handleSelectResult = (result) => {
    if (result.type) {
      // Nếu là dữ liệu thực, navigate kèm params
      navigate(result.path);
    } else {
      // Nếu là trang
      navigate(result.path);
    }
    onClose();
    setQuery('');
  };

  // Get icon theo loại
  const getResultIcon = (type) => {
    switch(type) {
      case 'teacher': return <FaUserTie className="result-icon teacher-icon" />;
      case 'employee': return <FaUser className="result-icon employee-icon" />;
      case 'contract': return <FaFileContract className="result-icon contract-icon" />;
      case 'course': return <FaBook className="result-icon course-icon" />;
      default: return <FaChartLine className="result-icon page-icon" />;
    }
  };

  // Highlight text với hỗ trợ fuzzy
  const highlightText = (text, query) => {
    if (!query || !text) return text;
    
    const searchTerm = query.toLowerCase();
    const textLower = text.toLowerCase();
    
    // Tìm vị trí match
    let indices = [];
    let startIndex = textLower.indexOf(searchTerm);
    
    if (startIndex === -1) {
      // Tìm fuzzy match
      const words = text.split(/\s+/);
      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const wordLower = word.toLowerCase();
        if (wordLower.includes(searchTerm) || levenshteinDistance(searchTerm, wordLower) <= 2) {
          const wordStart = text.indexOf(word, startIndex);
          indices.push({ start: wordStart, end: wordStart + word.length });
        }
      }
    } else {
      indices.push({ start: startIndex, end: startIndex + searchTerm.length });
    }
    
    if (indices.length === 0) return text;
    
    // Build highlighted text
    let result = [];
    let lastIndex = 0;
    indices.sort((a, b) => a.start - b.start);
    
    indices.forEach(({ start, end }) => {
      if (start > lastIndex) {
        result.push(text.substring(lastIndex, start));
      }
      result.push(`<mark class="highlight">${text.substring(start, end)}</mark>`);
      lastIndex = end;
    });
    
    if (lastIndex < text.length) {
      result.push(text.substring(lastIndex));
    }
    
    return <span dangerouslySetInnerHTML={{ __html: result.join('') }} />;
  };

  if (!isOpen) return null;

  return (
    <div className="search-modal-overlay" onClick={onClose}>
      <div className="search-modal-container" onClick={e => e.stopPropagation()}>
        <div className="search-modal-header">
          <FaSearch className="search-icon" />
          <input
            type="text"
            className="search-modal-input"
            placeholder="Tìm kiếm giảng viên, nhân viên, hợp đồng... (VD: gõ '04' để tìm giảng viên 04, 'gv01'...)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <button className="close-search-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        
        <div className="search-modal-body">
          {isLoading && (
            <div className="search-loading">
              <div className="spinner"></div>
              <span>Đang tìm kiếm...</span>
            </div>
          )}
          
          {!isLoading && query && results.length === 0 && (
            <div className="no-results">
              <p>Không tìm thấy kết quả cho "<strong>{query}</strong>"</p>
              <small>💡 Gợi ý: Thử gõ tên, mã số, hoặc vài chữ cái đầu/cuối</small>
            </div>
          )}
          
          {!isLoading && results.length > 0 && (
            <div className="search-results">
              <div className="results-header">
                <span>Tìm thấy {results.length} kết quả</span>
                <small className="search-hint">
                  ↑ ↓ để chọn, Enter để mở
                </small>
              </div>
              
              <div className="results-list">
                {results.map((result, idx) => (
                  <div
                    key={result.id || result.path}
                    className={`search-result-item ${idx === selectedIndex ? 'selected' : ''}`}
                    onClick={() => handleSelectResult(result)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    {getResultIcon(result.type)}
                    
                    <div className="result-content">
                      <div className="result-title">
                        {highlightText(result.title, query)}
                        {result.type && (
                          <span className={`result-type-badge ${result.type}`}>
                            {result.type === 'teacher' && 'Giảng viên'}
                            {result.type === 'employee' && 'Nhân viên'}
                            {result.type === 'contract' && 'Hợp đồng'}
                            {result.type === 'course' && 'Khóa học'}
                            {!result.type && 'Trang'}
                          </span>
                        )}
                      </div>
                      
                      {result.subtitle && (
                        <div className="result-subtitle">
                          {highlightText(result.subtitle, query)}
                        </div>
                      )}
                      
                      <div className="result-preview">
                        {highlightText(result.content.substring(0, 100), query)}
                      </div>
                      
                      {result.metadata && (
                        <div className="result-metadata">
                          {result.metadata.email && <span>📧 {result.metadata.email}</span>}
                          {result.metadata.phone && <span>📞 {result.metadata.phone}</span>}
                          {result.metadata.department && <span>🏢 {result.metadata.department}</span>}
                        </div>
                      )}
                    </div>
                    
                    {result.score > 0 && (
                      <div className="result-score">
                        {Math.round(result.score)}%
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Quick tips */}
          {!query && (
            <div className="search-tips-section">
              <h4>🔍 Gợi ý tìm kiếm:</h4>
              <div className="tips-grid">
                <div className="tip-item">
                  <span className="tip-icon">👨‍🏫</span>
                  <div>
                    <strong>Tìm giảng viên</strong>
                    <small>Gõ "gv01", "Nguyễn Văn", "04", "Công nghệ"</small>
                  </div>
                </div>
                <div className="tip-item">
                  <span className="tip-icon">👥</span>
                  <div>
                    <strong>Tìm nhân viên</strong>
                    <small>Gõ "NV001", "Hùng", "Trưởng phòng"</small>
                  </div>
                </div>
                <div className="tip-item">
                  <span className="tip-icon">📄</span>
                  <div>
                    <strong>Tìm hợp đồng</strong>
                    <small>Gõ "HD-2024", "chính thức"</small>
                  </div>
                </div>
                <div className="tip-item">
                  <span className="tip-icon">📚</span>
                  <div>
                    <strong>Tìm khóa học</strong>
                    <small>Gõ "React", "Quản trị", "Tiếng Anh"</small>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="search-modal-footer">
          <div className="search-shortcuts">
            <kbd>Ctrl+K</kbd>
            <span>để mở</span>
            <kbd>ESC</kbd>
            <span>để đóng</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchModalEnhanced;