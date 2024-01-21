export default function extractContentWithinHeading(markdown: string, targetHeading: string): string | null {
    let foundHeading = false;
    let contentToExtract = '';
  
    const lines = markdown.split('\n');
    for (const line of lines) {
      if (line.startsWith('## ' + targetHeading)) {
        foundHeading = true;
      } else if (foundHeading && !line.startsWith('## ')) {
        contentToExtract += line + '\n';
      } else if (foundHeading && line.startsWith('## ')) {
        break; // Stop extraction when the next h2 heading is found
      }
    }
  
    return contentToExtract.trim() || null; // Return trimmed content or null if not found
  }