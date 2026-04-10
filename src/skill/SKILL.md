---
name: typewriter
description: Create and edit Typewriter notebook files (.tw.json) — TypeScript notebooks with code cells, shell blocks, data visualizations, and rich text.
metadata:
  author: nikolasgioannou
  version: '1.0'
---

# Typewriter Notebook Skill

You can create and edit Typewriter notebook files (`.tw.json`). These are TypeScript notebooks similar to Jupyter notebooks, but for TypeScript powered by Bun.

## File Format

Notebooks are saved as `.tw.json` files. Here is the schema:

```json
{
  "id": "string (8-char random hex, e.g. 'a1b2c3d4')",
  "title": "string",
  "created": "number (Date.now() timestamp)",
  "updated": "number (Date.now() timestamp)",
  "blocks": [
    {
      "id": "string (UUID)",
      "type": "text | heading1 | heading2 | heading3 | code | shell | display | divider",
      "content": "string",
      "outputs": [],
      "executionCount": 0,
      "durationMs": 0,
      "displayConfig": {
        "variable": "string",
        "chartType": "table | line | bar | area | scatter | pie",
        "xKey": "string",
        "yKey": "string"
      }
    }
  ]
}
```

## Block Types

### Text Block

Plain text content. Content is stored as plain text (not HTML).

```json
{ "id": "uuid", "type": "text", "content": "Hello world" }
```

### Heading Blocks

Three levels: `heading1`, `heading2`, `heading3`. Content is plain text.

```json
{ "id": "uuid", "type": "heading1", "content": "My Section" }
```

### Code Block

TypeScript code executed by Bun. Variables persist across code blocks in the same notebook. Supports `import` and `require`.

```json
{
  "id": "uuid",
  "type": "code",
  "content": "const data = [1, 2, 3]\nconsole.log(data.length)"
}
```

### Shell Block

Terminal commands. Runs in the notebook's isolated environment (`~/.typewriter/notebooks/<id>/`). Use for installing packages.

```json
{ "id": "uuid", "type": "shell", "content": "bun add lodash" }
```

### Display Block

Visualize a variable from the kernel as a chart or table. Requires `displayConfig`.

```json
{
  "id": "uuid",
  "type": "display",
  "content": "",
  "displayConfig": {
    "variable": "salesData",
    "chartType": "bar",
    "xKey": "month",
    "yKey": "revenue"
  }
}
```

Chart types: `table`, `line`, `bar`, `area`, `scatter`, `pie`.

### Divider Block

Horizontal rule separator. Content should be empty.

```json
{ "id": "uuid", "type": "divider", "content": "" }
```

## Important Rules

1. **Filename**: The file MUST be named `<id>.tw.json` where `<id>` matches the notebook's `id` field. For example, a notebook with `"id": "f7a3b1c2"` must be saved as `f7a3b1c2.tw.json`.
2. **IDs**: The notebook `id` should be 8 random lowercase hex characters (e.g. `a1b2c3d4`). Block `id` fields should be UUIDs.
3. **Timestamps**: `created` and `updated` should be `Date.now()` values.
4. **Package installation**: If the notebook uses npm packages, include a shell block with `bun add <packages>` BEFORE the code blocks that import them.
5. **Variable persistence**: Variables declared in one code block are available in subsequent code blocks. Order matters.
6. **Display blocks**: The `variable` in `displayConfig` must match a variable name declared in a preceding code block. The variable should be an array of objects for charts.
7. **outputs, executionCount, durationMs**: Leave these empty/undefined when creating notebooks. They are populated at runtime.

## Example: Complete Notebook

```json
{
  "id": "f7a3b1c2",
  "title": "Sales Analysis",
  "created": 1712700000000,
  "updated": 1712700000000,
  "blocks": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "type": "heading1",
      "content": "Sales Data Analysis"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "type": "text",
      "content": "This notebook analyzes monthly sales data."
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440003",
      "type": "code",
      "content": "const salesData = [\n  { month: 'Jan', revenue: 4200 },\n  { month: 'Feb', revenue: 5100 },\n  { month: 'Mar', revenue: 6800 },\n  { month: 'Apr', revenue: 5900 },\n  { month: 'May', revenue: 7200 },\n  { month: 'Jun', revenue: 8100 }\n]\n\nconsole.log(`Total revenue: $${salesData.reduce((sum, d) => sum + d.revenue, 0)}`)"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440004",
      "type": "display",
      "content": "",
      "displayConfig": {
        "variable": "salesData",
        "chartType": "bar",
        "xKey": "month",
        "yKey": "revenue"
      }
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440005",
      "type": "divider",
      "content": ""
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440006",
      "type": "code",
      "content": "const avgRevenue = salesData.reduce((sum, d) => sum + d.revenue, 0) / salesData.length\nconsole.log(`Average monthly revenue: $${avgRevenue.toFixed(0)}`)\n\nconst bestMonth = salesData.reduce((best, d) => d.revenue > best.revenue ? d : best)\nconsole.log(`Best month: ${bestMonth.month} ($${bestMonth.revenue})`)"
    }
  ]
}
```

## Example: Notebook with Package Dependencies

```json
{
  "id": "b2c4d6e8",
  "title": "Data Processing with Lodash",
  "created": 1712700000000,
  "updated": 1712700000000,
  "blocks": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440010",
      "type": "shell",
      "content": "bun add lodash"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440011",
      "type": "code",
      "content": "import _ from 'lodash'\n\nconst numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]\nconst chunks = _.chunk(numbers, 3)\nconsole.log('Chunks:', chunks)"
    }
  ]
}
```
