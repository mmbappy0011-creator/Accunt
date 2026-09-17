export function formatCurrency(amount: number, lang: 'bn' | 'en' = 'bn'): string {
  const num = Number(amount) || 0;
  const formatted = num.toLocaleString('en-IN');
  return `৳${formatted}`;
}

export function toBengaliNumber(num: number | string): string {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, (digit) => bengaliDigits[Number(digit)]);
}

export function formatDate(dateStr: string, lang: 'bn' | 'en' = 'bn'): string {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      if (lang === 'bn') {
        const monthsBn = [
          'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
          'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
        ];
        const mIdx = parseInt(month, 10) - 1;
        return `${toBengaliNumber(day)} ${monthsBn[mIdx] || month}, ${toBengaliNumber(year)}`;
      } else {
        const monthsEn = [
          'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];
        const mIdx = parseInt(month, 10) - 1;
        return `${day} ${monthsEn[mIdx] || month}, ${year}`;
      }
    }
  } catch (e) {
    // fallback
  }
  return dateStr;
}

export function getCurrentMonthYear(): { month: number; year: number; monthNameBn: string; monthNameEn: string } {
  const now = new Date();
  const monthsBn = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ];
  const monthsEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const m = now.getMonth();
  return {
    month: m + 1,
    year: now.getFullYear(),
    monthNameBn: monthsBn[m],
    monthNameEn: monthsEn[m]
  };
}
