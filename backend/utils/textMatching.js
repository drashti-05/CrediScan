const { readFileSync } = require('fs');

class TextMatcher {
    // Find matching sentences between two texts
    static findMatchingSentences(text1, text2) {
        // Split texts into sentences
        const sentences1 = text1.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
        const sentences2 = text2.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
        
        const matches = [];
        
        sentences1.forEach(sentence1 => {
            sentences2.forEach(sentence2 => {
                const similarity = this.calculateSimilarity(sentence1, sentence2);
                if (similarity >= 80) { // High similarity threshold for sentences
                    matches.push({
                        sentence1,
                        sentence2,
                        similarity: Math.round(similarity * 100) / 100
                    });
                }
            });
        });

        return matches;
    }

    // Calculate Levenshtein distance between two strings
    static levenshteinDistance(str1, str2) {
        const m = str1.length;
        const n = str2.length;
        const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

        for (let i = 0; i <= m; i++) dp[i][0] = i;
        for (let j = 0; j <= n; j++) dp[0][j] = j;

        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                if (str1[i - 1] === str2[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1];
                } else {
                    dp[i][j] = 1 + Math.min(
                        dp[i - 1][j],     // deletion
                        dp[i][j - 1],     // insertion
                        dp[i - 1][j - 1]  // substitution
                    );
                }
            }
        }
        return dp[m][n];
    }

    // Calculate similarity percentage between two texts
    static calculateSimilarity(text1, text2) {
        // Normalize texts by converting to lowercase and removing extra spaces
        text1 = text1.toLowerCase().replace(/\s+/g, ' ').trim();
        text2 = text2.toLowerCase().replace(/\s+/g, ' ').trim();

        const maxLength = Math.max(text1.length, text2.length);
        if (maxLength === 0) return 100; // Both strings are empty

        const distance = this.levenshteinDistance(text1, text2);
        return ((maxLength - distance) / maxLength) * 100;
    }

    // Find similar documents
    static async findSimilarDocuments(content, existingDocs) {
        try {
            console.log('Finding similar documents for content length:', content.length);
            console.log('Number of existing docs:', existingDocs.length);

            const results = [];
            
            for (const doc of existingDocs) {
                try {
                    const docContent = readFileSync(doc.filePath, 'utf-8');
                    const overallSimilarity = this.calculateSimilarity(content, docContent);
                    const matchingSentences = this.findMatchingSentences(content, docContent);
                    
                    if (overallSimilarity >= 30 || matchingSentences.length > 0) {
                        results.push({
                            filename: doc.filename,
                            similarity: Math.round(overallSimilarity),
                            matches: matchingSentences.map(match => ({
                                original: match.sentence1,
                                matched: match.sentence2,
                                similarity: Math.round(match.similarity)
                            }))
                        });
                    }
                } catch (error) {
                    console.error(`Error reading document ${doc.id}:`, error);
                }
            }

            // Sort by similarity
            results.sort((a, b) => b.similarity - a.similarity);
            
            console.log('TextMatcher results:', JSON.stringify(results, null, 2));
            return results;
        } catch (error) {
            console.error('Error in findSimilarDocuments:', error);
            return [];
        }
    }
}

module.exports = TextMatcher; 