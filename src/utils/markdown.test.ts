import { describe, it, expect } from 'vitest';
import { renderMarkdown } from './markdown';

describe('renderMarkdown', () => {
  // ─── HTML escaping ─────────────────────────────────────────────────────────

  describe('HTML escaping', () => {
    it('escapes < and > in plain text', () => {
      const result = renderMarkdown('a < b > c');
      expect(result).toContain('&lt;');
      expect(result).toContain('&gt;');
      expect(result).not.toContain('<b');
    });

    it('escapes & in plain text', () => {
      const result = renderMarkdown('AT&T');
      expect(result).toContain('&amp;');
    });
  });

  // ─── Headers ──────────────────────────────────────────────────────────────

  describe('headers', () => {
    it('renders h1', () => {
      expect(renderMarkdown('# Title')).toContain('<h1 class="md-h1">Title</h1>');
    });

    it('renders h2', () => {
      expect(renderMarkdown('## Section')).toContain('<h2 class="md-h2">Section</h2>');
    });

    it('renders h3', () => {
      expect(renderMarkdown('### Sub')).toContain('<h3 class="md-h3">Sub</h3>');
    });

    it('renders h4, h5, h6', () => {
      expect(renderMarkdown('#### Four')).toContain('<h4 class="md-h4">Four</h4>');
      expect(renderMarkdown('##### Five')).toContain('<h5 class="md-h5">Five</h5>');
      expect(renderMarkdown('###### Six')).toContain('<h6 class="md-h6">Six</h6>');
    });

    it('does not treat # without trailing space as a header', () => {
      const result = renderMarkdown('#nospace');
      expect(result).not.toContain('<h1');
    });
  });

  // ─── Inline formatting ─────────────────────────────────────────────────────

  describe('inline formatting', () => {
    it('renders bold with **', () => {
      expect(renderMarkdown('**bold text**')).toContain('<strong>bold text</strong>');
    });

    it('renders italic with *', () => {
      expect(renderMarkdown('*italic*')).toContain('<em>italic</em>');
    });

    it('renders bold-italic with ***', () => {
      expect(renderMarkdown('***bold italic***')).toContain('<strong><em>bold italic</em></strong>');
    });

    it('renders inline code with backticks', () => {
      expect(renderMarkdown('`code here`')).toContain('<code class="md-code">code here</code>');
    });

    it('renders strikethrough with ~~', () => {
      expect(renderMarkdown('~~struck~~')).toContain('<del>struck</del>');
    });

    it('renders links [text](url)', () => {
      const result = renderMarkdown('[Click here](https://example.com)');
      expect(result).toContain('<a href="https://example.com"');
      expect(result).toContain('Click here');
      expect(result).toContain('target="_blank"');
      expect(result).toContain('rel="noopener noreferrer"');
    });
  });

  // ─── Fenced code blocks ────────────────────────────────────────────────────

  describe('fenced code blocks', () => {
    it('wraps ``` block in <pre>', () => {
      const md = '```\nconsole.log("hello");\n```';
      const result = renderMarkdown(md);
      expect(result).toContain('<pre class="md-code-block">');
      expect(result).toContain('console.log');
    });

    it('strips leading/trailing newlines from code block content', () => {
      const md = '```\nsome code\n```';
      const result = renderMarkdown(md);
      // The regex removes leading/trailing \n from the captured block
      expect(result).toContain('<pre class="md-code-block">some code</pre>');
    });

    it('does not apply inline formatting inside code blocks', () => {
      const md = '```\n**not bold**\n```';
      const result = renderMarkdown(md);
      expect(result).not.toContain('<strong>');
      expect(result).toContain('**not bold**');
    });
  });

  // ─── Lists ─────────────────────────────────────────────────────────────────

  describe('unordered lists', () => {
    it('renders - items as <ul><li>', () => {
      const result = renderMarkdown('- Item A\n- Item B');
      expect(result).toContain('<ul class="md-ul">');
      expect(result).toContain('<li>Item A</li>');
      expect(result).toContain('<li>Item B</li>');
      expect(result).toContain('</ul>');
    });

    it('supports * as list marker', () => {
      const result = renderMarkdown('* Star item');
      expect(result).toContain('<ul class="md-ul">');
      expect(result).toContain('<li>Star item</li>');
    });

    it('closes the list before a new block element', () => {
      const result = renderMarkdown('- item\n\n## Next');
      expect(result).toContain('</ul>');
      expect(result).toContain('<h2');
    });
  });

  describe('ordered lists', () => {
    it('renders 1. items as <ol><li>', () => {
      const result = renderMarkdown('1. First\n2. Second\n3. Third');
      expect(result).toContain('<ol class="md-ol">');
      expect(result).toContain('<li>First</li>');
      expect(result).toContain('<li>Second</li>');
      expect(result).toContain('<li>Third</li>');
      expect(result).toContain('</ol>');
    });
  });

  // ─── Blockquote ───────────────────────────────────────────────────────────

  describe('blockquotes', () => {
    it('renders > lines as blockquote', () => {
      const result = renderMarkdown('> This is a quote');
      expect(result).toContain('<blockquote class="md-quote">This is a quote</blockquote>');
    });
  });

  // ─── Horizontal rule ──────────────────────────────────────────────────────

  describe('horizontal rule', () => {
    it('renders --- as <hr>', () => {
      expect(renderMarkdown('---')).toContain('<hr class="md-hr" />');
    });

    it('renders ---- (extra dashes) as <hr>', () => {
      expect(renderMarkdown('----')).toContain('<hr class="md-hr" />');
    });
  });

  // ─── Paragraphs and empty lines ───────────────────────────────────────────

  describe('paragraphs', () => {
    it('wraps plain text in <p>', () => {
      expect(renderMarkdown('Hello world')).toContain('<p class="md-p">Hello world</p>');
    });

    it('converts empty lines to <br />', () => {
      const result = renderMarkdown('Para 1\n\nPara 2');
      expect(result).toContain('<br />');
    });
  });

  // ─── Complex / integration ────────────────────────────────────────────────

  describe('complex documents', () => {
    it('handles a multi-section document without throwing', () => {
      const md = [
        '# My Report',
        '',
        '## Summary',
        '',
        'This is a **bold** paragraph with a [link](https://example.com).',
        '',
        '- Item one',
        '- Item two',
        '',
        '> Important note',
        '',
        '---',
        '',
        '1. Step one',
        '2. Step two',
        '',
        '```',
        'const x = 1;',
        '```',
      ].join('\n');

      expect(() => renderMarkdown(md)).not.toThrow();
      const result = renderMarkdown(md);
      expect(result).toContain('<h1');
      expect(result).toContain('<h2');
      expect(result).toContain('<strong>');
      expect(result).toContain('<a href=');
      expect(result).toContain('<ul');
      expect(result).toContain('<blockquote');
      expect(result).toContain('<hr');
      expect(result).toContain('<ol');
      expect(result).toContain('<pre');
    });

    it('handles empty input without throwing', () => {
      expect(() => renderMarkdown('')).not.toThrow();
      // Empty string splits into one empty line, which produces a <br />
      expect(renderMarkdown('')).toBe('<br />');
    });

    it('applies inline formatting inside headers', () => {
      const result = renderMarkdown('## **Bold** Header');
      expect(result).toContain('<strong>Bold</strong>');
    });
  });
});
