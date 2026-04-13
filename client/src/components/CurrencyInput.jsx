import React, { useState, useEffect } from 'react';

const CurrencyInput = ({ value, onChange, placeholder, className, style, required }) => {
    const [displayValue, setDisplayValue] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        // Parent component'ten gelen ham değeri formatla (Örn: 112000.50)
        if (value === '' || value === null || value === undefined) {
            setDisplayValue('');
            return;
        }
        
        // Focus değilken parent'tan gelen değeri TR formatında göster
        if (!isFocused) {
            const numVal = parseFloat(value);
            if (!isNaN(numVal)) {
                // Sadece tam kısımları binlik ayırır, küsürat varsa ekler.
                setDisplayValue(new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(numVal));
            }
        }
    }, [value, isFocused]);

    const handleInputChange = (e) => {
        let val = e.target.value;
        
        // Eğer virgülden hiç yoksa ve en sonda veya ortada bir yerde nokta eklendiyse (numpad için)
        // Eğer birden fazla nokta varsa, formattan gelen binlik ayraçlardır, karışma.
        const dotCount = (val.match(/\./g) || []).length;
        if (dotCount === 1 && !val.includes(',')) {
            val = val.replace('.', ',');
        }

        // Formattan gelen mevcut tüm noktaları temizle (binlik ayraçlar)
        val = val.replace(/\./g, '');
        
        // Sadece rakam ve virgüle izin ver
        val = val.replace(/[^0-9,]/g, '');

        if (!val) {
            setDisplayValue('');
            onChange('');
            return;
        }

        // Birden fazla virgül varsa sadece ilkini tut
        const parts = val.split(',');
        let integerPart = parts[0];
        let decimalPart = parts.length > 1 ? parts[1].slice(0, 2) : null;

        // Tamsayı kısmına binlik ayracı (nokta) ekle
        if (integerPart) {
            integerPart = parseInt(integerPart, 10).toString();
            if (integerPart === 'NaN') integerPart = '0';
            integerPart = new Intl.NumberFormat('tr-TR').format(parseInt(integerPart));
        }

        let newDisplay = integerPart;
        let rawNumeric = integerPart.replace(/\./g, '');

        if (decimalPart !== null) {
            newDisplay += ',' + decimalPart;
            rawNumeric += '.' + decimalPart;
        } else if (val.endsWith(',')) {
            newDisplay += ',';
        }

        setDisplayValue(newDisplay);
        
        // Parent'a veritabanı formatında (float string) gönder
        onChange(rawNumeric);
    };

    return (
        <input
            type="text"
            value={displayValue}
            onChange={handleInputChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder || '0,00'}
            className={className}
            style={style}
            required={required}
        />
    );
};

export default CurrencyInput;
