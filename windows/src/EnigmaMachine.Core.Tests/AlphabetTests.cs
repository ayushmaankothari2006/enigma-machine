using EnigmaMachine.Core.Engine;
using Xunit;

namespace EnigmaMachine.Core.Tests;

public class AlphabetTests
{
    [Fact]
    public void Alphabet_HasExactly96Characters()
    {
        Assert.Equal(96, Alphabet.Size);
        Assert.Equal(96, Alphabet.Chars.Length);
        Assert.Equal(' ', Alphabet.Chars[0]);
        Assert.Equal('!', Alphabet.Chars[1]);
        Assert.Equal('~', Alphabet.Chars[94]);
        Assert.Equal('\n', Alphabet.Chars[95]);
    }

    [Theory]
    [InlineData(' ', 0)]
    [InlineData('!', 1)]
    [InlineData('A', 33)]
    [InlineData('a', 65)]
    [InlineData('0', 16)]
    [InlineData('~', 94)]
    [InlineData('\n', 95)]
    public void CharToIndex_MapsCorrectIndices(char ch, int expectedIndex)
    {
        Assert.Equal(expectedIndex, Alphabet.CharToIndex(ch));
    }

    [Theory]
    [InlineData(0, ' ')]
    [InlineData(1, '!')]
    [InlineData(33, 'A')]
    [InlineData(65, 'a')]
    [InlineData(94, '~')]
    [InlineData(95, '\n')]
    [InlineData(96, ' ')] // Modulo wrapping
    [InlineData(-1, '\n')] // Negative wrapping
    public void IndexToChar_MapsCorrectlyWithModulo(int index, char expectedChar)
    {
        Assert.Equal(expectedChar, Alphabet.IndexToChar(index));
    }

    [Fact]
    public void FormatGlyph_FormatsSpecialAndStandardGlyphs()
    {
        Assert.Equal("[Space]", Alphabet.FormatGlyph(0));
        Assert.Equal("[Enter]", Alphabet.FormatGlyph(95));
        Assert.Equal("A", Alphabet.FormatGlyph(33));
    }

    [Fact]
    public void SanitizeInput_NormalizesCrlfAndFiltersUnsupported()
    {
        string input = "Hello\r\nWorld!\r\nLine 2.\tEmoji 😊";
        string sanitized = Alphabet.SanitizeInput(input, out bool hasUnsupported);

        Assert.True(hasUnsupported);
        Assert.Equal("Hello\nWorld!\nLine 2.Emoji ", sanitized);
    }
}
