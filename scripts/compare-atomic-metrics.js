#!/usr/bin/env node
const { execSync } = require('child_process');

function run(cmd) {
  return execSync(cmd, { encoding: 'utf8' }).trim();
}

function listFiles(ref, prefix) {
  const output = run(`git ls-tree -r --name-only ${ref} -- ${prefix}`);
  if (!output) return [];
  return output.split('\n').filter(Boolean);
}

function fileContent(ref, filePath) {
  return run(`git show ${ref}:${filePath}`);
}

function countLines(text) {
  if (!text) return 0;
  return text.split(/\r?\n/).length;
}

function countNonEmptyLines(text) {
  if (!text) return 0;
  return text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0).length;
}

function duplicationIndex(ref, files) {
  const counts = new Map();
  let total = 0;

  files.forEach(file => {
    const content = fileContent(ref, file);
    content
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .forEach(line => {
        total += 1;
        counts.set(line, (counts.get(line) || 0) + 1);
      });
  });

  let duplicated = 0;
  counts.forEach(count => {
    if (count > 1) {
      duplicated += (count - 1);
    }
  });

  const percent = total === 0 ? 0 : (duplicated / total) * 100;
  return { total, duplicated, percent };
}

function summarize(ref) {
  const componentFiles = listFiles(ref, 'src/components');
  const sourceFiles = listFiles(ref, 'src');

  const totalLoc = sourceFiles.reduce((sum, file) => {
    return sum + countLines(fileContent(ref, file));
  }, 0);

  const componentLoc = componentFiles.reduce((sum, file) => {
    return sum + countLines(fileContent(ref, file));
  }, 0);

  const dup = duplicationIndex(ref, sourceFiles);
  const avgComponentLoc = componentFiles.length === 0
    ? 0
    : (componentLoc / componentFiles.length);

  return {
    ref,
    components: componentFiles.length,
    totalLoc,
    duplicationPercent: dup.percent,
    avgComponentLoc
  };
}

function formatNumber(value) {
  return Number.isFinite(value) ? value.toFixed(1) : String(value);
}

function main() {
  const refs = process.argv.slice(2);
  if (refs.length < 2) {
    console.error('Usage: scripts/compare-atomic-metrics.js <refA> <refB>');
    process.exit(1);
  }

  const [refA, refB] = refs;
  const summaryA = summarize(refA);
  const summaryB = summarize(refB);

  const lines = [];
  lines.push('# Metrics Comparison');
  lines.push('');
  lines.push('| Metrica | Projeto A (React + Atomic) | Projeto B (React Padrao) |');
  lines.push('| --- | --- | --- |');
  lines.push(`| Total de Componentes (Arquivos) | ${summaryB.components} | ${summaryA.components} |`);
  lines.push(`| Linhas de Codigo Totais (Source) | ${summaryB.totalLoc} | ${summaryA.totalLoc} |`);
  lines.push(`| Indice de Duplicidade (linhas duplicadas) | ${formatNumber(summaryB.duplicationPercent)}% | ${formatNumber(summaryA.duplicationPercent)}% |`);
  lines.push(`| Linhas alteradas por Feature (Media) | N/A | N/A |`);
  lines.push(`| Issues de Regressao (Simulado) | N/A | N/A |`);
  lines.push(`| Arquivos tocados por Bug Fix | N/A | N/A |`);
  lines.push(`| Linhas por Componente (media) | ${formatNumber(summaryB.avgComponentLoc)} | ${formatNumber(summaryA.avgComponentLoc)} |`);
  lines.push('');
  lines.push('Notas:');
  lines.push('- O indice de duplicidade e uma estimativa simples baseada em linhas nao vazias iguais.');
  lines.push('- Linhas alteradas por feature, regressao e arquivos por bug fix exigem historico de trabalho e nao sao inferiveis via repo.');
  lines.push('');

  process.stdout.write(lines.join('\n'));
}

main();
