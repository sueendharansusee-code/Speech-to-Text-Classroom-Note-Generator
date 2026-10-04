/**
 * TextProcessor
 * Client-side NLP text cleaning, paragraph structuring, and metrics calculation.
 */
class TextProcessor {
    /**
     * Cleans raw speech output:
     * - Removes unnecessary duplicate spaces
     * - Capitalizes sentence beginnings
     * - Fixes basic punctuation spacing
     */
    static cleanText(text) {
        if (!text) return "";

        // 1. Remove duplicate spaces and tabs
        let cleaned = text.replace(/[ \t]+/g, ' ');
        cleaned = cleaned.replace(/\n\s*\n/g, '\n\n');

        // 2. Fix punctuation spacing
        cleaned = cleaned.replace(/\s+([.,?!:;])/g, '$1');
        cleaned = cleaned.replace(/([.,?!:;])(?=[A-Za-z])/g, '$1 ');

        // 3. Capitalize first letter of whole text
        if (cleaned.length > 0 && /[a-z]/.test(cleaned[0])) {
            cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
        }

        // 4. Capitalize after sentence-ending punctuation (. ? !)
        cleaned = cleaned.replace(/([.?!])(\s+)([a-z])/g, (match, p1, p2, p3) => {
            return p1 + p2 + p3.toUpperCase();
        });

        // 5. Capitalize after newlines
        cleaned = cleaned.replace(/(\n+)([a-z])/g, (match, p1, p2) => {
            return p1 + p2.toUpperCase();
        });

        return cleaned.trim();
    }

    /**
     * Groups sentences into readable paragraphs (default ~3-4 sentences per paragraph)
     */
    static formatParagraphs(text, sentencesPerParagraph = 3) {
        const cleaned = this.cleanText(text);
        if (!cleaned) return "";

        // Split text by sentence terminators or line breaks
        const sentences = cleaned.split(/(?<=[.?!])\s+/);
        if (sentences.length <= sentencesPerParagraph) {
            return cleaned;
        }

        const paragraphs = [];
        let currentGroup = [];

        for (let i = 0; i < sentences.length; i++) {
            const sentence = sentences[i].trim();
            if (!sentence) continue;

            currentGroup.push(sentence);
            if (currentGroup.length >= sentencesPerParagraph) {
                paragraphs.push(currentGroup.join(' '));
                currentGroup = [];
            }
        }

        if (currentGroup.length > 0) {
            paragraphs.push(currentGroup.join(' '));
        }

        return paragraphs.join('\n\n');
    }

    /**
     * Calculates word count
     */
    static countWords(text) {
        if (!text || !text.trim()) return 0;
        const matches = text.trim().match(/\b[\w'-]+\b/g);
        return matches ? matches.length : 0;
    }

    /**
     * Calculates character count
     */
    static countCharacters(text) {
        return text ? text.length : 0;
    }

    /**
     * Formats seconds into HH:MM:SS
     */
    static formatDuration(totalSeconds) {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        const pad = (num) => String(num).padStart(2, '0');
        return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
}

window.TextProcessor = TextProcessor;
