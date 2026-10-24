import MarkdownIt from 'markdown-it'

/**
 * Markdown for unit texts. Raw HTML is disabled, so text written by the AI or
 * a creator cannot inject scripts; links open in a new tab.
 */
const md = new MarkdownIt({ html: false, linkify: true, breaks: true })

const defaultLink = md.renderer.rules.link_open ?? ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options))
md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  tokens[idx].attrSet('target', '_blank')
  tokens[idx].attrSet('rel', 'noopener noreferrer nofollow')
  return defaultLink(tokens, idx, options, env, self)
}

export const renderMarkdown = (text?: string | null): string => (text ? md.render(text) : '')
