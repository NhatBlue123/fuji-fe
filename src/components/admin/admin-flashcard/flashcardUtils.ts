
import * as XLSX from 'xlsx';
import { Flashcard } from '@/types/flashcard';

/**
 * Export flashcards to Excel file
 */
export const exportFlashcardsToExcel = (flashcards: Flashcard[], filename: string = 'flashcards.xlsx') => {
    // Prepare data for Excel
    const data = flashcards.map((card, index) => ({
        'STT': index + 1,
        'Kanji': card.kanji,
        'Hiragana': card.hiragana,
        'Nghĩa': card.meaning,
        'Ví dụ': card.example,
        'Bài học': card.lesson,
        'Loại': card.type,
        'Trạng thái': card.studyStatus === 'learned' ? 'Đã học' :
            card.studyStatus === 'review' ? 'Cần ôn' : 'Chưa học',
        'Lượt xem': card.viewCount || 0,
    }));

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Flashcards');

    // Set column widths
    const columnWidths = [
        { wch: 5 },  // STT
        { wch: 15 }, // Kanji
        { wch: 15 }, // Hiragana
        { wch: 20 }, // Nghĩa
        { wch: 40 }, // Ví dụ
        { wch: 20 }, // Bài học
        { wch: 12 }, // Loại
        { wch: 12 }, // Trạng thái
        { wch: 10 }, // Lượt xem
    ];
    worksheet['!cols'] = columnWidths;

    // Generate and download file
    XLSX.writeFile(workbook, filename);
};

/**
 * Download Excel template
 */
export const downloadExcelTemplate = () => {
    const templateData = [
        {
            'Kanji': '食べる',
            'Hiragana': 'たべる',
            'Nghĩa': 'Ăn',
            'Ví dụ': '朝ごはんを食べます。',
            'Bài học': 'N5 - Unit 1',
            'Loại': 'Vocabulary',
        },
        {
            'Kanji': '飲む',
            'Hiragana': 'のむ',
            'Nghĩa': 'Uống',
            'Ví dụ': '水を飲みます。',
            'Bài học': 'N5 - Unit 1',
            'Loại': 'Vocabulary',
        },
        {
            'Kanji': '見る',
            'Hiragana': 'みる',
            'Nghĩa': 'Nhìn, xem',
            'Ví dụ': 'テレビを見ます。',
            'Bài học': 'N5 - Unit 1',
            'Loại': 'Vocabulary',
        },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');

    // Set column widths
    worksheet['!cols'] = [
        { wch: 15 }, // Kanji
        { wch: 15 }, // Hiragana
        { wch: 20 }, // Nghĩa
        { wch: 40 }, // Ví dụ
        { wch: 20 }, // Bài học
        { wch: 12 }, // Loại
    ];

    XLSX.writeFile(workbook, 'flashcard_template.xlsx');
};
