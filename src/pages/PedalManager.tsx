import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Upload, Eye, Code, Trash2, EyeOff, Edit3, Check, X, AlertCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { VidalLogo } from '@/components/VidalLogo';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// Template for custom pedal
const PEDAL_TEMPLATE = `// Template de Pedal Customizado para Vidal Pedalboard
// Este arquivo define um pedal de efeito usando Web Audio API

class CustomPedal {
  constructor(audioContext) {
    this.audioContext = audioContext;
    this.input = audioContext.createGain();
    this.output = audioContext.createGain();
    this.configure();
    this.connect();
  }

  configure() {
    this.output.gain.value = 1.0;
  }

  connect() {
    this.input.connect(this.output);
  }

  static getParams() {
    return [
      { id: 'volume', label: 'Volume', min: 0, max: 1, default: 0.8, unit: '' },
    ];
  }

  static getMetadata() {
    return {
      name: 'CUSTOM',
      subtitle: 'My Effect',
      color: 'hsl(280, 70%, 50%)',
      glowColor: 'hsl(280, 80%, 60%)',
      author: 'Seu Nome',
      version: '1.0.0',
    };
  }

  setParam(paramId, value) {
    switch (paramId) {
      case 'volume':
        this.output.gain.value = value;
        break;
    }
  }

  destroy() {
    this.input.disconnect();
    this.output.disconnect();
  }
}

export default CustomPedal;
`;

interface CustomPedalDB {
  id: string;
  name: string;
  subtitle: string | null;
  color: string;
  glow_color: string;
  params: any;
  is_on_board: boolean;
  is_hidden: boolean;
  code: string;
  author: string | null;
  version: string | null;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metadata?: {
    name: string;
    subtitle: string;
    color: string;
    glowColor: string;
    author: string;
    version: string;
  };
  params?: Array<{
    id: string;
    label: string;
    min: number;
    max: number;
    default: number;
    unit: string;
  }>;
}

function validatePedalCode(code: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const classMatch = code.match(/class\s+(\w+)\s*{/);
  if (!classMatch) {
    // Check for simpler format (just input/output nodes)
    if (code.includes('this.input') && code.includes('this.output')) {
      // Simple pedal format - valid
      const nameMatch = code.match(/class\s+(\w+)/);
      return {
        isValid: true,
        errors: [],
        warnings: ['Formato simplificado detectado.'],
        metadata: {
          name: nameMatch?.[1] || 'CUSTOM',
          subtitle: 'Effect',
          color: 'hsl(280, 70%, 50%)',
          glowColor: 'hsl(280, 80%, 60%)',
          author: 'Unknown',
          version: '1.0.0',
        },
        params: [],
      };
    }
    errors.push('Nenhuma classe encontrada.');
    return { isValid: false, errors, warnings };
  }

  if (!code.includes('this.input')) errors.push("Node 'this.input' não encontrado.");
  if (!code.includes('this.output')) errors.push("Node 'this.output' não encontrado.");

  let metadata;
  let params;

  try {
    const metadataMatch = code.match(/getMetadata\s*\(\s*\)\s*{\s*return\s*({[\s\S]*?});/);
    if (metadataMatch) {
      const metaStr = metadataMatch[1];
      const nameMatch = metaStr.match(/name:\s*['"]([^'"]+)['"]/);
      const subtitleMatch = metaStr.match(/subtitle:\s*['"]([^'"]+)['"]/);
      const colorMatch = metaStr.match(/color:\s*['"]([^'"]+)['"]/);
      const glowMatch = metaStr.match(/glowColor:\s*['"]([^'"]+)['"]/);
      const authorMatch = metaStr.match(/author:\s*['"]([^'"]+)['"]/);
      const versionMatch = metaStr.match(/version:\s*['"]([^'"]+)['"]/);

      metadata = {
        name: nameMatch?.[1] || classMatch[1],
        subtitle: subtitleMatch?.[1] || 'Effect',
        color: colorMatch?.[1] || 'hsl(280, 70%, 50%)',
        glowColor: glowMatch?.[1] || 'hsl(280, 80%, 60%)',
        author: authorMatch?.[1] || 'Unknown',
        version: versionMatch?.[1] || '1.0.0',
      };
    } else {
      metadata = {
        name: classMatch[1],
        subtitle: 'Effect',
        color: 'hsl(280, 70%, 50%)',
        glowColor: 'hsl(280, 80%, 60%)',
        author: 'Unknown',
        version: '1.0.0',
      };
    }

    const paramsMatch = code.match(/getParams\s*\(\s*\)\s*{\s*return\s*(\[[\s\S]*?\]);/);
    if (paramsMatch) {
      const paramsStr = paramsMatch[1];
      const paramMatches = paramsStr.matchAll(/{\s*id:\s*['"](\w+)['"],\s*label:\s*['"]([^'"]+)['"],\s*min:\s*([\d.]+),\s*max:\s*([\d.]+),\s*default:\s*([\d.]+),\s*unit:\s*['"]([^'"]*)['"].*?}/g);
      params = [];
      for (const match of paramMatches) {
        params.push({
          id: match[1],
          label: match[2],
          min: parseFloat(match[3]),
          max: parseFloat(match[4]),
          default: parseFloat(match[5]),
          unit: match[6],
        });
      }
    }
  } catch {
    warnings.push('Não foi possível extrair metadados automaticamente.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    metadata,
    params,
  };
}

function PedalPreview({ metadata, params, isOn = true }: {
  metadata: ValidationResult['metadata'];
  params: ValidationResult['params'];
  isOn?: boolean;
}) {
  if (!metadata) return null;

  return (
    <div
      className="relative rounded-2xl p-4 w-48 transition-all"
      style={{
        background: `linear-gradient(180deg, hsl(220 10% 16%) 0%, hsl(220 12% 12%) 50%, hsl(220 14% 8%) 100%)`,
        boxShadow: isOn
          ? `0 0 30px ${metadata.color}40, 0 8px 32px rgba(0,0,0,0.6)`
          : '0 8px 32px rgba(0,0,0,0.6)',
        border: `1px solid ${isOn ? metadata.color : 'hsl(220, 15%, 25%)'}`,
      }}
    >
      <div className="absolute top-3 right-3">
        <div
          className="w-3 h-3 rounded-full"
          style={{
            backgroundColor: isOn ? 'hsl(142, 70%, 45%)' : 'hsl(0, 65%, 40%)',
            boxShadow: isOn ? '0 0 10px hsl(142, 70%, 45%)' : 'none',
          }}
        />
      </div>
      <div className="text-center mb-3">
        <h3 className="font-mono font-bold text-sm tracking-wide" style={{ color: metadata.color }}>
          {metadata.name}
        </h3>
        <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{metadata.subtitle}</p>
      </div>
      <div className="flex flex-wrap gap-2 justify-center mb-3">
        {params?.slice(0, 4).map((param, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="w-8 h-8 rounded-full border-2" style={{ borderColor: metadata.color, background: 'hsl(220, 15%, 12%)' }} />
            <span className="text-[7px] text-muted-foreground uppercase">{param.label}</span>
          </div>
        ))}
      </div>
      <div className="w-10 h-10 mx-auto rounded-full" style={{
        background: 'linear-gradient(180deg, hsl(220, 12%, 35%) 0%, hsl(220, 15%, 20%) 100%)',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
      }} />
      <p className="text-[8px] text-muted-foreground text-center mt-2">
        by {metadata.author} v{metadata.version}
      </p>
    </div>
  );
}

export default function PedalManager() {
  const { user } = useAuth();
  const [customPedals, setCustomPedals] = useState<CustomPedalDB[]>([]);
  const [uploadedCode, setUploadedCode] = useState('');
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [showTemplate, setShowTemplate] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch from Supabase
  const fetchPedals = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('custom_pedals')
      .select('*')
      .eq('user_id', user.id);
    if (data) setCustomPedals(data as unknown as CustomPedalDB[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchPedals(); }, [fetchPedals]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const code = event.target?.result as string;
      setUploadedCode(code);
      setValidation(validatePedalCode(code));
    };
    reader.readAsText(file);
  }, []);

  const handleCodeChange = useCallback((code: string) => {
    setUploadedCode(code);
    if (code.trim()) {
      setValidation(validatePedalCode(code));
    } else {
      setValidation(null);
    }
  }, []);

  const handleAddPedal = useCallback(async () => {
    if (!validation?.isValid || !validation.metadata || !user) return;

    const { error } = await supabase.from('custom_pedals').insert({
      user_id: user.id,
      name: validation.metadata.name,
      subtitle: validation.metadata.subtitle,
      color: validation.metadata.color,
      glow_color: validation.metadata.glowColor,
      code: uploadedCode,
      params: validation.params || [],
      is_on_board: true,
      is_hidden: false,
      author: validation.metadata.author,
      version: validation.metadata.version,
    });

    if (!error) {
      setUploadedCode('');
      setValidation(null);
      fetchPedals();
    }
  }, [validation, uploadedCode, user, fetchPedals]);

  const toggleOnBoard = useCallback(async (id: string, currentValue: boolean) => {
    await supabase.from('custom_pedals').update({ is_on_board: !currentValue }).eq('id', id);
    fetchPedals();
  }, [fetchPedals]);

  const toggleHidden = useCallback(async (id: string, currentValue: boolean) => {
    await supabase.from('custom_pedals').update({ is_hidden: !currentValue }).eq('id', id);
    fetchPedals();
  }, [fetchPedals]);

  const deletePedal = useCallback(async (id: string) => {
    await supabase.from('custom_pedals').delete().eq('id', id);
    fetchPedals();
  }, [fetchPedals]);

  const downloadTemplate = useCallback(() => {
    const blob = new Blob([PEDAL_TEMPLATE], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'custom-pedal-template.js';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-card border-b border-border px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm">Voltar</span>
            </Link>
            <VidalLogo />
          </div>
          <h1 className="font-mono font-bold text-lg text-foreground">
            Gerenciador de Pedais
          </h1>
        </div>
      </header>

      <main className="flex-1 p-4 max-w-7xl mx-auto w-full space-y-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" /> Adicionar Novo Pedal
            </CardTitle>
            <CardDescription>
              Faça upload de um arquivo JavaScript ou cole o código diretamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex-1">
                <h4 className="font-semibold text-sm">Template de Pedal</h4>
                <p className="text-xs text-muted-foreground">Baixe o template para criar seu pedal.</p>
              </div>
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="w-4 h-4 mr-2" /> Baixar
              </Button>
              <Dialog open={showTemplate} onOpenChange={setShowTemplate}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm"><Eye className="w-4 h-4 mr-2" /> Ver</Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
                  <DialogHeader>
                    <DialogTitle>Template de Pedal Customizado</DialogTitle>
                  </DialogHeader>
                  <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs font-mono">{PEDAL_TEMPLATE}</pre>
                </DialogContent>
              </Dialog>
            </div>

            <div className="flex items-center gap-4">
              <Input type="file" accept=".js,.javascript" onChange={handleFileUpload} className="flex-1" />
              <span className="text-xs text-muted-foreground">ou</span>
            </div>

            <Textarea
              placeholder="Cole o código JavaScript do seu pedal aqui..."
              value={uploadedCode}
              onChange={(e) => handleCodeChange(e.target.value)}
              className="font-mono text-xs min-h-[200px]"
            />

            {validation && (
              <div className="space-y-4">
                {validation.errors.length > 0 && (
                  <div className="p-3 bg-destructive/10 border border-destructive/50 rounded-lg">
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-destructive mb-2">
                      <X className="w-4 h-4" /> Erros
                    </h4>
                    <ul className="text-xs text-destructive space-y-1">
                      {validation.errors.map((err, i) => <li key={i}>• {err}</li>)}
                    </ul>
                  </div>
                )}
                {validation.warnings.length > 0 && (
                  <div className="p-3 bg-yellow-500/10 border border-yellow-500/50 rounded-lg">
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-yellow-500 mb-2">
                      <AlertCircle className="w-4 h-4" /> Avisos
                    </h4>
                    <ul className="text-xs text-yellow-500 space-y-1">
                      {validation.warnings.map((w, i) => <li key={i}>• {w}</li>)}
                    </ul>
                  </div>
                )}
                {validation.isValid && validation.metadata && (
                  <div className="p-4 bg-green-500/10 border border-green-500/50 rounded-lg">
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-green-500 mb-4">
                      <Check className="w-4 h-4" /> Código Válido!
                    </h4>
                    <div className="flex items-start gap-6">
                      <PedalPreview metadata={validation.metadata} params={validation.params} />
                      <div className="flex-1 space-y-2">
                        <p className="text-sm"><strong>Nome:</strong> {validation.metadata.name}</p>
                        <p className="text-sm"><strong>Subtítulo:</strong> {validation.metadata.subtitle}</p>
                        <p className="text-sm"><strong>Autor:</strong> {validation.metadata.author}</p>
                        <Button onClick={handleAddPedal} className="mt-4">
                          <Check className="w-4 h-4 mr-2" /> Adicionar ao Pedalboard
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pedals Library */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="w-5 h-5" /> Meus Pedais ({customPedals.length})
            </CardTitle>
            <CardDescription>
              Gerencie seus pedais. Use "Aparecer" para mostrá-los na tela principal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-8 text-muted-foreground text-sm">Carregando...</p>
            ) : customPedals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhum pedal customizado ainda.</p>
                <p className="text-sm">Faça upload de um arquivo JS acima.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {customPedals.map((pedal) => (
                  <div
                    key={pedal.id}
                    className={`p-4 rounded-lg border transition-opacity ${pedal.is_hidden ? 'opacity-50' : ''}`}
                    style={{ borderColor: pedal.color }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-bold" style={{ color: pedal.color }}>{pedal.name}</h4>
                        <p className="text-xs text-muted-foreground">{pedal.subtitle}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {pedal.author && `by ${pedal.author}`} {pedal.version && `• v${pedal.version}`}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {pedal.is_hidden && <span className="text-[9px] px-1.5 py-0.5 bg-muted rounded">OCULTO</span>}
                        {!pedal.is_on_board && <span className="text-[9px] px-1.5 py-0.5 bg-muted rounded">FORA</span>}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => toggleHidden(pedal.id, pedal.is_hidden)} className="text-xs">
                        {pedal.is_hidden ? <><Eye className="w-3 h-3 mr-1" /> Mostrar</> : <><EyeOff className="w-3 h-3 mr-1" /> Ocultar</>}
                      </Button>
                      <Button
                        variant={pedal.is_on_board ? "outline" : "default"}
                        size="sm"
                        onClick={() => toggleOnBoard(pedal.id, pedal.is_on_board)}
                        className="text-xs"
                      >
                        {pedal.is_on_board ? 'Remover do Board' : '✅ Aparecer'}
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="destructive" size="sm" className="text-xs">
                            <Trash2 className="w-3 h-3 mr-1" /> Excluir
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Excluir {pedal.name}?</DialogTitle>
                            <DialogDescription>Esta ação não pode ser desfeita.</DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button variant="destructive" onClick={() => deletePedal(pedal.id)}>
                              Excluir Permanentemente
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
