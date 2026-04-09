import {
  AreaChart as AreaIcon,
  BarChart3,
  LineChart,
  PieChart as PieIcon,
  ScatterChart,
  Table,
} from 'lucide-react'
import { useCallback, useEffect, useMemo } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart as RechartsLineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart as RechartsScatterChart,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts'

import type { ChartType, DisplayConfig } from '@shared/notebook'
import { cn } from '@lib/cn'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@ui/index'
import { useKernelStore } from '@store/kernel.store'

interface DisplayBlockProps {
  blockId: string
  notebookId: string
  config: DisplayConfig
  onConfigChange: (config: DisplayConfig) => void
}

const chartTypes: Array<{ type: ChartType; label: string; icon: React.ReactNode }> = [
  { type: 'table', label: 'Table', icon: <Table size={14} /> },
  { type: 'bar', label: 'Bar Chart', icon: <BarChart3 size={14} /> },
  { type: 'line', label: 'Line Chart', icon: <LineChart size={14} /> },
  { type: 'area', label: 'Area Chart', icon: <AreaIcon size={14} /> },
  { type: 'scatter', label: 'Scatter Plot', icon: <ScatterChart size={14} /> },
  { type: 'pie', label: 'Pie Chart', icon: <PieIcon size={14} /> },
]

const COLORS = [
  '#3b82f6',
  '#8b5cf6',
  '#06b6d4',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#6366f1',
]

function DataTable({ data }: { data: Record<string, unknown>[] }) {
  if (data.length === 0) return null
  const keys = Object.keys(data[0] ?? {})

  return (
    <div className="max-h-64 overflow-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-border border-b">
            {keys.map((key) => (
              <th key={key} className="text-fg-secondary px-3 py-1.5 text-left font-medium">
                {key}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-border border-b last:border-0">
              {keys.map((key) => (
                <td key={key} className="text-fg-primary px-3 py-1.5">
                  {String(row[key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ChartRenderer({
  data,
  config,
}: {
  data: Record<string, unknown>[]
  config: DisplayConfig
}) {
  if (data.length === 0)
    return <div className="text-fg-tertiary p-4 text-center text-sm">No data</div>

  const { chartType, xKey, yKey } = config
  const keys = Object.keys(data[0] ?? {})
  const x = xKey || keys[0] || ''
  const y = yKey || keys[1] || ''

  if (chartType === 'table') return <DataTable data={data} />

  if (chartType === 'pie') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            dataKey={y}
            nameKey={x}
            cx="50%"
            cy="50%"
            outerRadius={100}
            label
            isAnimationActive={false}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <RechartsTooltip />
        </PieChart>
      </ResponsiveContainer>
    )
  }

  const common = (
    <>
      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
      <XAxis dataKey={x} tick={{ fontSize: 11 }} stroke="var(--color-fg-tertiary)" />
      <YAxis tick={{ fontSize: 11 }} stroke="var(--color-fg-tertiary)" />
      <RechartsTooltip
        cursor={{ fill: 'var(--color-bg-tertiary)' }}
        contentStyle={{
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: '6px',
          fontSize: '12px',
        }}
      />
    </>
  )

  return (
    <ResponsiveContainer width="100%" height={300}>
      {chartType === 'bar' ? (
        <BarChart data={data}>
          {common}
          <Bar dataKey={y} fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      ) : chartType === 'line' ? (
        <RechartsLineChart data={data}>
          {common}
          <Line type="monotone" dataKey={y} stroke="#3b82f6" strokeWidth={2} dot={false} />
        </RechartsLineChart>
      ) : chartType === 'area' ? (
        <AreaChart data={data}>
          {common}
          <Area type="monotone" dataKey={y} stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} />
        </AreaChart>
      ) : chartType === 'scatter' ? (
        <RechartsScatterChart data={data}>
          {common}
          <Scatter dataKey={y} fill="#3b82f6" />
        </RechartsScatterChart>
      ) : null}
    </ResponsiveContainer>
  )
}

export function DisplayBlock({ blockId, notebookId, config, onConfigChange }: DisplayBlockProps) {
  const { evalVariable, listVars, displayData, availableVars } = useKernelStore()
  const data = displayData[blockId]
  const fetchedVars = availableVars[blockId] ?? []

  const keys = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return []
    return Object.keys((data as Record<string, unknown>[])[0] ?? {})
  }, [data])

  const handleRefresh = useCallback(() => {
    if (config.variable) {
      evalVariable(notebookId, blockId, config.variable)
    }
  }, [config.variable, notebookId, blockId, evalVariable])

  // Fetch available variables when the select opens
  const handleVarsOpen = useCallback(() => {
    listVars(notebookId, blockId)
  }, [notebookId, blockId, listVars])

  // Auto-fetch data when variable changes
  useEffect(() => {
    if (config.variable) {
      handleRefresh()
    }
  }, [config.variable, handleRefresh])

  // Auto-detect keys when data arrives
  useEffect(() => {
    if (keys.length > 0 && !config.xKey && !config.yKey) {
      onConfigChange({ ...config, xKey: keys[0], yKey: keys[1] })
    }
  }, [keys, config, onConfigChange])

  return (
    <div className="border-border bg-bg-secondary overflow-hidden rounded-lg border">
      <div className="border-border flex flex-wrap items-center gap-3 border-b px-3 py-2">
        <div className="flex items-center gap-2">
          <label className="text-fg-tertiary text-xs">Variable</label>
          <Select
            value={config.variable || undefined}
            onValueChange={(value) => onConfigChange({ ...config, variable: value })}
            onOpenChange={(open) => {
              if (open) handleVarsOpen()
            }}
          >
            <SelectTrigger className="min-w-[120px] font-mono text-xs">
              <SelectValue placeholder="Select variable" />
            </SelectTrigger>
            <SelectContent>
              {fetchedVars.length > 0 ? (
                fetchedVars.map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))
              ) : (
                <div className="text-fg-tertiary px-2 py-1.5 text-xs">No variables found</div>
              )}
            </SelectContent>
          </Select>
        </div>

        <TooltipProvider delayDuration={300}>
          <div className="border-border flex items-center overflow-hidden rounded-md border">
            {chartTypes.map((ct) => (
              <Tooltip key={ct.type}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onConfigChange({ ...config, chartType: ct.type })}
                    className={cn(
                      'flex h-7 items-center justify-center px-2 transition-colors',
                      config.chartType === ct.type
                        ? 'bg-bg-tertiary text-fg-primary'
                        : 'text-fg-tertiary hover:text-fg-secondary'
                    )}
                  >
                    {ct.icon}
                  </button>
                </TooltipTrigger>
                <TooltipContent>{ct.label}</TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>

        {config.chartType !== 'table' && keys.length > 0 && (
          <>
            <div className="flex items-center gap-2">
              <label className="text-fg-tertiary text-xs">X</label>
              <Select
                value={config.xKey || ''}
                onValueChange={(value) => onConfigChange({ ...config, xKey: value })}
              >
                <SelectTrigger className="min-w-[80px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {keys.map((k) => (
                    <SelectItem key={k} value={k}>
                      {k}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-fg-tertiary text-xs">Y</label>
              <Select
                value={config.yKey || ''}
                onValueChange={(value) => onConfigChange({ ...config, yKey: value })}
              >
                <SelectTrigger className="min-w-[80px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {keys.map((k) => (
                    <SelectItem key={k} value={k}>
                      {k}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        <div className="flex-1" />
      </div>

      {data && Array.isArray(data) ? (
        <ChartRenderer data={data as Record<string, unknown>[]} config={config} />
      ) : data && data !== null ? (
        <div className="text-fg-primary p-4 font-mono text-xs">
          <pre className="whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
        </div>
      ) : (
        <div className="text-fg-tertiary p-8 text-center text-sm">
          {!config.variable
            ? 'Select a variable to display data'
            : data === null
              ? 'Variable not found — run the code above first'
              : 'Loading...'}
        </div>
      )}
    </div>
  )
}
