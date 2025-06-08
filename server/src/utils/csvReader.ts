import { parse } from 'csv-parse/sync'
import fs from 'fs'
import path from 'path'

export type CSVData = Record<string, string>[]

export function readCSV(filePath: string): CSVData {
  const absolutePath = path.resolve(__dirname, '..', '..', filePath)
  const fileContent = fs.readFileSync(absolutePath, 'utf-8')
  return parse(fileContent, {
    columns: true,
    skip_empty_lines: true
  })
} 