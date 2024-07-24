const { readFileSync } = require('fs');
const useFont = require('../fonts/useFont');

// Mock the fs
jest.mock('fs');

describe('useFont', () => {
  it('should return a data URI for the font', () => {
    // Arrange
    const mockFontPath = '/mock/path/to/font.ttf';
    const mockBase64Font = 'dGVzdGJhc2U2NA=='; 
    const expectedDataUri = `data:font/ttf;base64,${mockBase64Font}`;

    // Mock readFileSync to return a base64 encoded font
    readFileSync.mockReturnValue(mockBase64Font);

    // Act
    const result = useFont(mockFontPath);

    expect(result).toBe(expectedDataUri);
  });
});
