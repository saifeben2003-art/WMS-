'use client';

import { useState } from 'react';
import { Plug, Zap, ArrowRightLeft, CheckCircle, XCircle, Clock, RefreshCw, Server, Settings, Activity, Globe, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import type { SyncDirection, SyncStatus } from '@/types/wms';

interface Props {
  t: (key: string, params?: Record<string, string | number>) => string;
  language: string;
}

const mockEventMappings = [
  { eventType: 'RECEIVED', endpoint: '/api/sap/goods-receipt', method: 'POST', enabled: true },
  { eventType: 'DISPATCHED', endpoint: '/api/sap/goods-issue', method: 'POST', enabled: true },
  { eventType: 'MOVEMENT', endpoint: '/api/sap/transfer-posting', method: 'POST', enabled: true },
  { eventType: 'INVENTORY_UPDATE', endpoint: '/api/sap/inventory-update', method: 'PATCH', enabled: false },
];

const mockSyncLog = [
  { id: '1', eventType: 'RECEIVED', direction: 'OUTBOUND' as SyncDirection, status: 'SUCCESS' as SyncStatus, timestamp: '2025-01-15T14:32:00Z', retryCount: 0 },
  { id: '2', eventType: 'DISPATCHED', direction: 'OUTBOUND' as SyncDirection, status: 'SUCCESS' as SyncStatus, timestamp: '2025-01-15T13:21:00Z', retryCount: 0 },
  { id: '3', eventType: 'MOVEMENT', direction: 'OUTBOUND' as SyncDirection, status: 'FAILED' as SyncStatus, timestamp: '2025-01-15T12:15:00Z', retryCount: 3 },
  { id: '4', eventType: 'INVENTORY_UPDATE', direction: 'INBOUND' as SyncDirection, status: 'SUCCESS' as SyncStatus, timestamp: '2025-01-15T11:45:00Z', retryCount: 0 },
  { id: '5', eventType: 'RECEIVED', direction: 'INBOUND' as SyncDirection, status: 'RETRYING' as SyncStatus, timestamp: '2025-01-15T10:30:00Z', retryCount: 1 },
  { id: '6', eventType: 'DISPATCHED', direction: 'OUTBOUND' as SyncDirection, status: 'PENDING' as SyncStatus, timestamp: '2025-01-15T10:28:00Z', retryCount: 0 },
  { id: '7', eventType: 'MOVEMENT', direction: 'OUTBOUND' as SyncDirection, status: 'SUCCESS' as SyncStatus, timestamp: '2025-01-15T09:55:00Z', retryCount: 0 },
  { id: '8', eventType: 'RECEIVED', direction: 'INBOUND' as SyncDirection, status: 'FAILED' as SyncStatus, timestamp: '2025-01-15T09:12:00Z', retryCount: 5 },
];

const statusStyles: Record<SyncStatus, string> = {
  PENDING: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  SENT: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  SUCCESS: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  FAILED: 'bg-red-500/10 text-red-400 border-red-500/20',
  RETRYING: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

const directionStyles: Record<SyncDirection, string> = {
  OUTBOUND: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  INBOUND: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
};

export function IntegrationPage({ t }: Props) {
  const [config, setConfig] = useState({
    endpoint: 'https://sap.combilift.com:44300',
    authMethod: 'API_KEY',
    apiKey: '••••••••••••••••xx7f3k',
    sapSystemId: 'CLP',
    client: '100',
    protocol: 'OData',
    enabled: true,
  });
  const [mappings, setMappings] = useState(mockEventMappings);

  const handleSaveConfig = () => { toast.success(t('integration.saveConfig') + ' (demo)'); };
  const toggleMapping = (index: number) => { const updated = [...mappings]; updated[index].enabled = !updated[index].enabled; setMappings(updated); toast.success(updated[index].enabled ? 'Enabled' : 'Disabled'); };

  const successCount = mockSyncLog.filter((l) => l.status === 'SUCCESS').length;
  const failedCount = mockSyncLog.filter((l) => l.status === 'FAILED').length;
  const healthPct = Math.round((successCount / mockSyncLog.length) * 100);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-bold text-slate-100">{t('integration.title')}</h1><p className="text-sm text-slate-500 mt-1">{t('integration.eventDrivenConfig')}</p></div>
        <Button onClick={handleSaveConfig} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium"><Settings className="h-4 w-4 mr-2" /> {t('integration.saveConfig')}</Button>
      </div>

      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10"><Zap className="h-4 w-4 text-amber-400" /></div>
            <div><h3 className="text-sm font-medium text-amber-300">{t('integration.eventDriven')}</h3><p className="text-xs text-slate-400 mt-1 leading-relaxed">{t('integration.eventDrivenDesc')}</p></div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-slate-800 bg-slate-900/50"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{t('integration.syncHealth')}</p><p className="text-2xl font-bold text-slate-100 mt-1">{healthPct}%</p></div><div className={`flex h-10 w-10 items-center justify-center rounded-lg ${healthPct >= 80 ? 'bg-emerald-500/10' : healthPct >= 50 ? 'bg-amber-500/10' : 'bg-red-500/10'}`}><Activity className={`h-5 w-5 ${healthPct >= 80 ? 'text-emerald-400' : healthPct >= 50 ? 'text-amber-400' : 'text-red-400'}`} /></div></div></CardContent></Card>
        <Card className="border-slate-800 bg-slate-900/50"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{t('integration.successful')}</p><p className="text-2xl font-bold text-emerald-400 mt-1">{successCount}</p></div><CheckCircle className="h-8 w-8 text-emerald-500/30" /></div></CardContent></Card>
        <Card className="border-slate-800 bg-slate-900/50"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{t('integration.failed')}</p><p className="text-2xl font-bold text-red-400 mt-1">{failedCount}</p></div><XCircle className="h-8 w-8 text-red-500/30" /></div></CardContent></Card>
      </div>

      <Card className="border-slate-800 bg-slate-900/50">
        <CardHeader className="pb-4"><div className="flex items-center gap-2"><Server className="h-5 w-5 text-amber-400" /><CardTitle className="text-sm font-medium text-slate-200">{t('integration.connectionConfig')}</CardTitle></div><CardDescription className="text-slate-500 text-xs">{t('integration.connectionConfigDesc')}</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label className="text-slate-400">{t('integration.sapEndpoint')}</Label><Input value={config.endpoint} onChange={(e) => setConfig({ ...config, endpoint: e.target.value })} className="border-slate-700 bg-slate-800 text-slate-200 mt-1" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-slate-400">{t('integration.authMethod')}</Label><Select value={config.authMethod} onValueChange={(v) => setConfig({ ...config, authMethod: v })}><SelectTrigger className="border-slate-700 bg-slate-800 text-slate-200 mt-1"><SelectValue /></SelectTrigger><SelectContent className="border-slate-700 bg-slate-800"><SelectItem value="API_KEY" className="text-slate-200 focus:bg-slate-700">API Key</SelectItem><SelectItem value="BASIC" className="text-slate-200 focus:bg-slate-700">Basic Auth</SelectItem><SelectItem value="OAUTH" className="text-slate-200 focus:bg-slate-700">OAuth 2.0</SelectItem></SelectContent></Select></div>
              <div><Label className="text-slate-400">{t('integration.protocol')}</Label><Select value={config.protocol} onValueChange={(v) => setConfig({ ...config, protocol: v })}><SelectTrigger className="border-slate-700 bg-slate-800 text-slate-200 mt-1"><SelectValue /></SelectTrigger><SelectContent className="border-slate-700 bg-slate-800"><SelectItem value="OData" className="text-slate-200 focus:bg-slate-700">OData</SelectItem><SelectItem value="RFC" className="text-slate-200 focus:bg-slate-700">RFC</SelectItem><SelectItem value="IDOC" className="text-slate-200 focus:bg-slate-700">IDOC</SelectItem><SelectItem value="REST" className="text-slate-200 focus:bg-slate-700">REST</SelectItem></SelectContent></Select></div>
            </div>
            <div><Label className="text-slate-400">{t('integration.apiKey')}</Label><Input type="password" value={config.apiKey} onChange={(e) => setConfig({ ...config, apiKey: e.target.value })} className="border-slate-700 bg-slate-800 text-slate-200 mt-1" /></div>
            <div className="grid grid-cols-2 gap-4"><div><Label className="text-slate-400">{t('integration.sapSystemId')}</Label><Input value={config.sapSystemId} onChange={(e) => setConfig({ ...config, sapSystemId: e.target.value })} className="border-slate-700 bg-slate-800 text-slate-200 mt-1" /></div><div><Label className="text-slate-400">{t('integration.client')}</Label><Input value={config.client} onChange={(e) => setConfig({ ...config, client: e.target.value })} className="border-slate-700 bg-slate-800 text-slate-200 mt-1" /></div></div>
          </div>
          <div className="flex items-center gap-3 pt-2"><Switch checked={config.enabled} onCheckedChange={(v) => setConfig({ ...config, enabled: v })} /><Label className="text-slate-400">{t('integration.enableSync')}</Label></div>
        </CardContent>
      </Card>

      <Card className="border-slate-800 bg-slate-900/50">
        <CardHeader className="pb-4"><div className="flex items-center gap-2"><ArrowRightLeft className="h-5 w-5 text-amber-400" /><CardTitle className="text-sm font-medium text-slate-200">{t('integration.eventMapping')}</CardTitle></div><CardDescription className="text-slate-500 text-xs">{t('integration.eventMappingDesc')}</CardDescription></CardHeader>
        <CardContent className="p-0">
          <table className="w-full"><thead><tr className="border-b border-slate-800"><th className="text-left text-xs text-slate-500 px-4 py-3">{t('integration.eventType')}</th><th className="text-left text-xs text-slate-500 px-4 py-3">{t('integration.sapEndpointCol')}</th><th className="text-left text-xs text-slate-500 px-4 py-3 hidden sm:table-cell">{t('integration.method')}</th><th className="text-left text-xs text-slate-500 px-4 py-3">{t('integration.enabled')}</th></tr></thead><tbody>{mappings.map((m, i) => (<tr key={m.eventType} className="border-b border-slate-800/50 hover:bg-slate-800/50"><td className="py-3 px-4"><Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/20">{m.eventType}</Badge></td><td className="py-3 px-4 text-xs font-mono text-slate-300">{m.endpoint}</td><td className="py-3 px-4 hidden sm:table-cell"><Badge variant="outline" className="text-[10px] bg-slate-700/50 text-slate-300 border-slate-600">{m.method}</Badge></td><td className="py-3 px-4"><Switch checked={m.enabled} onCheckedChange={() => toggleMapping(i)} /></td></tr>))}</tbody></table>
        </CardContent>
      </Card>

      <Card className="border-slate-800 bg-slate-900/50">
        <CardHeader className="pb-4"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><RefreshCw className="h-5 w-5 text-amber-400" /><CardTitle className="text-sm font-medium text-slate-200">{t('integration.syncLog')}</CardTitle></div><Button variant="outline" size="sm" className="border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-300 text-xs" onClick={() => toast.info(t('integration.refresh') + ' (demo)')}><RefreshCw className="h-3 w-3 mr-1" /> {t('integration.refresh')}</Button></div><CardDescription className="text-slate-500 text-xs">{t('integration.syncLogDesc')}</CardDescription></CardHeader>
        <CardContent className="p-0">
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full"><thead><tr className="border-b border-slate-800"><th className="text-left text-xs text-slate-500 px-4 py-3">{t('integration.event')}</th><th className="text-left text-xs text-slate-500 px-4 py-3">{t('integration.direction')}</th><th className="text-left text-xs text-slate-500 px-4 py-3">{t('common.status')}</th><th className="text-left text-xs text-slate-500 px-4 py-3 hidden sm:table-cell">{t('integration.timestamp')}</th><th className="text-left text-xs text-slate-500 px-4 py-3 hidden sm:table-cell">{t('integration.retries')}</th></tr></thead><tbody>{mockSyncLog.map((log) => (<tr key={log.id} className="border-b border-slate-800/50 hover:bg-slate-800/50"><td className="py-3 px-4"><Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/20">{log.eventType}</Badge></td><td className="py-3 px-4"><Badge variant="outline" className={`text-[10px] ${directionStyles[log.direction]}`}>{log.direction === 'OUTBOUND' ? 'WMS → SAP' : 'SAP → WMS'}</Badge></td><td className="py-3 px-4"><div className="flex items-center gap-1.5">{log.status === 'SUCCESS' && <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />}{log.status === 'FAILED' && <XCircle className="h-3.5 w-3.5 text-red-400" />}{(log.status === 'PENDING' || log.status === 'RETRYING') && <Clock className="h-3.5 w-3.5 text-amber-400" />}{log.status === 'SENT' && <Globe className="h-3.5 w-3.5 text-cyan-400" />}<Badge variant="outline" className={`text-[10px] ${statusStyles[log.status]}`}>{log.status}</Badge></div></td><td className="py-3 px-4 text-xs text-slate-400 hidden sm:table-cell">{new Date(log.timestamp).toLocaleString()}</td><td className="py-3 px-4 hidden sm:table-cell">{log.retryCount > 0 ? <span className={`text-xs font-medium ${log.retryCount >= 3 ? 'text-red-400' : 'text-amber-400'}`}>{log.retryCount}</span> : <span className="text-xs text-slate-600">0</span>}</td></tr>))}</tbody></table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
