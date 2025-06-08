import { parse } from 'csv-parse/sync'
import { promises as fs } from 'fs'
import path from 'path'

export type CSVData = Record<string, string>[]

export async function readCSV(filePath: string): Promise<CSVData> {
  const absolutePath = path.resolve(process.cwd(), filePath)
  const fileContent = await fs.readFile(absolutePath, 'utf-8')
  return parse(fileContent, {
    columns: true,
    skip_empty_lines: true
  })
}
