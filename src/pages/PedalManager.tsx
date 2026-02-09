import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Upload, Eye, Code, Trash2, EyeOff, Edit3, Check, X, AlertCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { VidalLogo } from '@/components/VidalLogo';

// Template for custom pedal
const PEDAL_TEMPLATE = `// Template de Pedal Customizado para Vidal Pedalboard
// Este arquivo define um pedal de efeito usando Web Audio API

class CustomPedal {
  constructor(audioContext) {
    this.audioContext = audioContext;
    
    // Nodes de entrada e saída (obrigatórios)
    this.input = audioContext.createGain();
    this.output = audioContext.createGain();
    
    // Adicione seus nodes aqui
    // Exemplo: this.filter = audioContext.createBiquadFilter();
    
    this.configure();
    this.connect();
  }

  // Configure os parâmetros dos seus nodes
  configure() {
    this.output.gain.value = 1.0;
    
    // Adicione suas configurações aqui
    // Exemplo:
    // this.filter.type = 'lowpass';
    // this.filter.frequency.value = 1000;
  }

  // Conecte os nodes na ordem desejada
  connect() {
    this.input.connect(this.output);
    
    // Adicione suas conexões aqui
    // Exemplo:
    // this.input.connect(this.filter);
    // this.filter.connect(this.output);
  }

  // Parâmetros expostos para os knobs (obrigatório)
  // Retorna array de objetos com: id, label, min, max, default, unit
  static getParams() {
    return [
      { id: 'volume', label: 'Volume', min: 0, max: 1, default: 0.8, unit: '' },
      // Adicione mais parâmetros aqui
      // { id: 'frequency', label: 'Freq', min: 100, max: 10000, default: 1000, unit: 'Hz' },
    ];
  }

  // Metadados do pedal (obrigatório)
  static getMetadata() {
    return {
      name: 'CUSTOM',           // Nome exibido no pedal (máx 12 chars)
      subtitle: 'My Effect',    // Subtítulo (máx 15 chars)
      color: 'hsl(280, 70%, 50%)',      // Cor principal HSL
      glowColor: 'hsl(280, 80%, 60%)',  // Cor do glow HSL
      author: 'Seu Nome',
      version: '1.0.0',
    };
  }

  // Atualiza um parâmetro (chamado pelos knobs)
  setParam(paramId, value) {
    switch (paramId) {
      case 'volume':
        this.output.gain.value = value;
        break;
      // Adicione cases para seus parâmetros
    }
  }

  // Limpa recursos quando o pedal é removido
  destroy() {
    this.input.disconnect();
    this.output.disconnect();
  }
}

// IMPORTANTE: Exporte a classe
export default CustomPedal;
`;

interface CustomPedalData {
  id: string;
  name: string;
  subtitle: string;
  color: string;
  glowColor: string;
  author: string;
  version: string;
  code: string;
  params: Array<{
    id: string;
    label: string;
    min: number;
    max: number;
    default: number;
    unit: string;
  }>;
  isHidden: boolean;
  isOnBoard: boolean;
  createdAt: Date;
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

// Validate uploaded JS code
function validatePedalCode(code: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check for class definition
  const classMatch = code.match(/class\s+(\w+)\s*{/);
  if (!classMatch) {
    errors.push('Nenhuma classe encontrada. O arquivo deve definir uma classe.');
    return { isValid: false, errors, warnings };
  }

  // Check for required methods
  const requiredMethods = ['constructor', 'configure', 'connect', 'getParams', 'getMetadata', 'setParam'];
  for (const method of requiredMethods) {
    const methodRegex = new RegExp(`(static\\s+)?${method}\\s*\\(`);
    if (!methodRegex.test(code)) {
      errors.push(`Método obrigatório '${method}' não encontrado.`);
    }
  }

  // Check for input/output nodes
  if (!code.includes('this.input')) {
    errors.push("Node 'this.input' não encontrado no constructor.");
  }
  if (!code.includes('this.output')) {
    errors.push("Node 'this.output' não encontrado no constructor.");
  }

  // Check for export
  if (!code.includes('export default')) {
    warnings.push("Recomendado: adicione 'export default' no final.");
  }

  // Try to extract metadata
  let metadata;
  let params;
  
  try {
    // Extract getMetadata return object
    const metadataMatch = code.match(/getMetadata\s*\(\s*\)\s*{\s*return\s*({[\s\S]*?});/);
    if (metadataMatch) {
      // Simple extraction - in production would use proper parsing
      const metaStr = metadataMatch[1];
      const nameMatch = metaStr.match(/name:\s*['"]([^'"]+)['"]/);
      const subtitleMatch = metaStr.match(/subtitle:\s*['"]([^'"]+)['"]/);
      const colorMatch = metaStr.match(/color:\s*['"]([^'"]+)['"]/);
      const glowMatch = metaStr.match(/glowColor:\s*['"]([^'"]+)['"]/);
      const authorMatch = metaStr.match(/author:\s*['"]([^'"]+)['"]/);
      const versionMatch = metaStr.match(/version:\s*['"]([^'"]+)['"]/);
      
      metadata = {
        name: nameMatch?.[1] || 'CUSTOM',
        subtitle: subtitleMatch?.[1] || 'Effect',
        color: colorMatch?.[1] || 'hsl(280, 70%, 50%)',
        glowColor: glowMatch?.[1] || 'hsl(280, 80%, 60%)',
        author: authorMatch?.[1] || 'Unknown',
        version: versionMatch?.[1] || '1.0.0',
      };
    }

    // Extract getParams return array
    const paramsMatch = code.match(/getParams\s*\(\s*\)\s*{\s*return\s*(\[[\s\S]*?\]);/);
    if (paramsMatch) {
      // Extract parameter objects
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
  } catch (e) {
    warnings.push('Não foi possível extrair metadados automaticamente.');
  }

  if (!metadata) {
    errors.push('Não foi possível extrair metadados do getMetadata().');
  }

  if (!params || params.length === 0) {
    warnings.push('Nenhum parâmetro encontrado em getParams(). O pedal não terá knobs.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    metadata,
    params,
  };
}

// Preview component for pedal
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
      {/* LED */}
      <div className="absolute top-3 right-3">
        <div
          className="w-3 h-3 rounded-full"
          style={{
            backgroundColor: isOn ? 'hsl(var(--stage-active))' : 'hsl(var(--stage-danger))',
            boxShadow: isOn ? '0 0 10px hsl(var(--stage-active))' : 'none',
          }}
        />
      </div>

      {/* Title */}
      <div className="text-center mb-3">
        <h3 
          className="font-display font-bold text-sm tracking-wide"
          style={{ color: metadata.color }}
        >
          {metadata.name}
        </h3>
        <p className="text-[9px] text-muted-foreground uppercase tracking-wider">
          {metadata.subtitle}
        </p>
      </div>

      {/* Knobs Preview */}
      <div className="flex flex-wrap gap-2 justify-center mb-3">
        {params?.slice(0, 4).map((param, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div
              className="w-8 h-8 rounded-full border-2"
              style={{ 
                borderColor: metadata.color,
                background: 'hsl(220, 15%, 12%)',
              }}
            />
            <span className="text-[7px] text-muted-foreground uppercase">
              {param.label}
            </span>
          </div>
        ))}
      </div>

      {/* Footswitch */}
      <div
        className="w-10 h-10 mx-auto rounded-full"
        style={{
          background: 'linear-gradient(180deg, hsl(220, 12%, 35%) 0%, hsl(220, 15%, 20%) 100%)',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.2)',
        }}
      />

      {/* Author */}
      <p className="text-[8px] text-muted-foreground text-center mt-2">
        by {metadata.author} v{metadata.version}
      </p>
    </div>
  );
}

export default function PedalManager() {
  const [customPedals, setCustomPedals] = useState<CustomPedalData[]>(() => {
    const saved = localStorage.getItem('vidal-custom-pedals');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [uploadedCode, setUploadedCode] = useState('');
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [editingPedal, setEditingPedal] = useState<CustomPedalData | null>(null);
  const [showTemplate, setShowTemplate] = useState(false);

  // Save to localStorage whenever pedals change
  const savePedals = useCallback((pedals: CustomPedalData[]) => {
    setCustomPedals(pedals);
    localStorage.setItem('vidal-custom-pedals', JSON.stringify(pedals));
  }, []);

  // Handle file upload
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

  // Handle code paste/edit
  const handleCodeChange = useCallback((code: string) => {
    setUploadedCode(code);
    if (code.trim()) {
      setValidation(validatePedalCode(code));
    } else {
      setValidation(null);
    }
  }, []);

  // Add pedal to library
  const handleAddPedal = useCallback(() => {
    if (!validation?.isValid || !validation.metadata) return;

    const newPedal: CustomPedalData = {
      id: `custom-${Date.now()}`,
      name: validation.metadata.name,
      subtitle: validation.metadata.subtitle,
      color: validation.metadata.color,
      glowColor: validation.metadata.glowColor,
      author: validation.metadata.author,
      version: validation.metadata.version,
      code: uploadedCode,
      params: validation.params || [],
      isHidden: false,
      isOnBoard: true,
      createdAt: new Date(),
    };

    savePedals([...customPedals, newPedal]);
    setUploadedCode('');
    setValidation(null);
  }, [validation, uploadedCode, customPedals, savePedals]);

  // Toggle pedal visibility
  const toggleHidden = useCallback((id: string) => {
    savePedals(customPedals.map(p => 
      p.id === id ? { ...p, isHidden: !p.isHidden } : p
    ));
  }, [customPedals, savePedals]);

  // Toggle pedal on board
  const toggleOnBoard = useCallback((id: string) => {
    savePedals(customPedals.map(p => 
      p.id === id ? { ...p, isOnBoard: !p.isOnBoard } : p
    ));
  }, [customPedals, savePedals]);

  // Delete pedal
  const deletePedal = useCallback((id: string) => {
    savePedals(customPedals.filter(p => p.id !== id));
  }, [customPedals, savePedals]);

  // Download template
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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm">Voltar</span>
            </Link>
            <VidalLogo />
          </div>
          <h1 className="font-display font-bold text-lg text-foreground">
            Gerenciador de Pedais
          </h1>
        </div>
      </header>

      <main className="flex-1 p-4 max-w-7xl mx-auto w-full">
        {/* Upload Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Adicionar Novo Pedal
            </CardTitle>
            <CardDescription>
              Faça upload de um arquivo JavaScript seguindo o template ou cole o código diretamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Template Download */}
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex-1">
                <h4 className="font-semibold text-sm">Template de Pedal</h4>
                <p className="text-xs text-muted-foreground">
                  Baixe o template para criar seu pedal customizado.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="w-4 h-4 mr-2" />
                Baixar Template
              </Button>
              <Dialog open={showTemplate} onOpenChange={setShowTemplate}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    Ver Template
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
                  <DialogHeader>
                    <DialogTitle>Template de Pedal Customizado</DialogTitle>
                    <DialogDescription>
                      Use este template como base para criar seu próprio pedal.
                    </DialogDescription>
                  </DialogHeader>
                  <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs font-mono">
                    {PEDAL_TEMPLATE}
                  </pre>
                </DialogContent>
              </Dialog>
            </div>

            {/* File Upload */}
            <div className="flex items-center gap-4">
              <Input
                type="file"
                accept=".js,.javascript"
                onChange={handleFileUpload}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground">ou</span>
            </div>

            {/* Code Editor */}
            <Textarea
              placeholder="Cole o código JavaScript do seu pedal aqui..."
              value={uploadedCode}
              onChange={(e) => handleCodeChange(e.target.value)}
              className="font-mono text-xs min-h-[200px]"
            />

            {/* Validation Results */}
            {validation && (
              <div className="space-y-4">
                {/* Errors */}
                {validation.errors.length > 0 && (
                  <div className="p-3 bg-destructive/10 border border-destructive/50 rounded-lg">
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-destructive mb-2">
                      <X className="w-4 h-4" />
                      Erros Encontrados
                    </h4>
                    <ul className="text-xs text-destructive space-y-1">
                      {validation.errors.map((err, i) => (
                        <li key={i}>• {err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Warnings */}
                {validation.warnings.length > 0 && (
                  <div className="p-3 bg-yellow-500/10 border border-yellow-500/50 rounded-lg">
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-yellow-500 mb-2">
                      <AlertCircle className="w-4 h-4" />
                      Avisos
                    </h4>
                    <ul className="text-xs text-yellow-500 space-y-1">
                      {validation.warnings.map((warn, i) => (
                        <li key={i}>• {warn}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Success + Preview */}
                {validation.isValid && validation.metadata && (
                  <div className="p-4 bg-green-500/10 border border-green-500/50 rounded-lg">
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-green-500 mb-4">
                      <Check className="w-4 h-4" />
                      Código Válido! Preview do Pedal:
                    </h4>
                    <div className="flex items-start gap-6">
                      <PedalPreview metadata={validation.metadata} params={validation.params} />
                      <div className="flex-1 space-y-2">
                        <p className="text-sm"><strong>Nome:</strong> {validation.metadata.name}</p>
                        <p className="text-sm"><strong>Subtítulo:</strong> {validation.metadata.subtitle}</p>
                        <p className="text-sm"><strong>Autor:</strong> {validation.metadata.author}</p>
                        <p className="text-sm"><strong>Versão:</strong> {validation.metadata.version}</p>
                        <p className="text-sm"><strong>Parâmetros:</strong> {validation.params?.length || 0}</p>
                        <Button onClick={handleAddPedal} className="mt-4">
                          <Check className="w-4 h-4 mr-2" />
                          Adicionar ao Pedalboard
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Custom Pedals Library */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="w-5 h-5" />
              Meus Pedais ({customPedals.length})
            </CardTitle>
            <CardDescription>
              Gerencie seus pedais customizados. Oculte, remova do pedalboard ou exclua permanentemente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {customPedals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhum pedal customizado ainda.</p>
                <p className="text-sm">Faça upload de um arquivo JS acima para começar.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {customPedals.map((pedal) => (
                  <div
                    key={pedal.id}
                    className={`p-4 rounded-lg border transition-opacity ${
                      pedal.isHidden ? 'opacity-50' : ''
                    }`}
                    style={{ borderColor: pedal.color }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-bold" style={{ color: pedal.color }}>
                          {pedal.name}
                        </h4>
                        <p className="text-xs text-muted-foreground">{pedal.subtitle}</p>
                        <p className="text-[10px] text-muted-foreground">
                          by {pedal.author} • v{pedal.version}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {/* Status badges */}
                        {pedal.isHidden && (
                          <span className="text-[9px] px-1.5 py-0.5 bg-muted rounded">OCULTO</span>
                        )}
                        {!pedal.isOnBoard && (
                          <span className="text-[9px] px-1.5 py-0.5 bg-muted rounded">FORA</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {/* Toggle visibility */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleHidden(pedal.id)}
                        className="text-xs"
                      >
                        {pedal.isHidden ? (
                          <><Eye className="w-3 h-3 mr-1" /> Mostrar</>
                        ) : (
                          <><EyeOff className="w-3 h-3 mr-1" /> Ocultar</>
                        )}
                      </Button>

                      {/* Toggle on board */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleOnBoard(pedal.id)}
                        className="text-xs"
                      >
                        {pedal.isOnBoard ? 'Remover do Board' : 'Adicionar ao Board'}
                      </Button>

                      {/* Edit code */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-xs">
                            <Edit3 className="w-3 h-3 mr-1" /> Editar
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
                          <DialogHeader>
                            <DialogTitle>Editar {pedal.name}</DialogTitle>
                          </DialogHeader>
                          <Textarea
                            value={pedal.code}
                            onChange={(e) => {
                              const newCode = e.target.value;
                              const newValidation = validatePedalCode(newCode);
                              if (newValidation.isValid && newValidation.metadata) {
                                savePedals(customPedals.map(p => 
                                  p.id === pedal.id ? {
                                    ...p,
                                    code: newCode,
                                    name: newValidation.metadata!.name,
                                    subtitle: newValidation.metadata!.subtitle,
                                    color: newValidation.metadata!.color,
                                    glowColor: newValidation.metadata!.glowColor,
                                    params: newValidation.params || [],
                                  } : p
                                ));
                              }
                            }}
                            className="font-mono text-xs min-h-[400px]"
                          />
                        </DialogContent>
                      </Dialog>

                      {/* Delete */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="destructive" size="sm" className="text-xs">
                            <Trash2 className="w-3 h-3 mr-1" /> Excluir
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Excluir {pedal.name}?</DialogTitle>
                            <DialogDescription>
                              Esta ação não pode ser desfeita. O pedal será removido permanentemente.
                            </DialogDescription>
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
