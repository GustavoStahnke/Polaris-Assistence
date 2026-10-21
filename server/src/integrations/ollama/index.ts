import { z } from 'zod';
import { defineIntegration, IntegrationConfigError } from '../types';
import { listModels } from './api';

export const ollamaConfigSchema = z.object({
  url: z
    .string()
    .trim()
    .default('http://localhost:11434')
    .meta({ title: 'Endereço do Ollama', description: 'Padrão: http://localhost:11434' }),
  model: z.string().trim().default('').meta({
    title: 'Modelo',
    description: 'Escolha um dos modelos instalados no seu Ollama.',
    widget: 'model-select',
  }),
});
export type OllamaConfig = z.infer<typeof ollamaConfigSchema>;

export const ollama = defineIntegration<OllamaConfig>({
  id: 'ollama',
  name: 'IA local (Ollama)',
  category: 'ia',
  description: 'A inteligência da Polaris rodando no seu computador: privada e sem custo.',
  icon: 'Bot',
  authType: 'local',
  availability: 'available',
  free: true,
  configSchema: ollamaConfigSchema,
  isConfigured: (config) => Boolean(config.url && config.model),
  guide: {
    title: 'Como ligar a IA local',
    steps: [
      'Instale o **Ollama** (ollama.com). Ele é gratuito e roda no seu computador.',
      'No terminal, baixe um modelo. Sugestão leve e boa em português: `ollama pull llama3.2:3b` (ou `qwen2.5:7b` se o PC for mais forte).',
      'Deixe o Ollama aberto. Aqui, confira o endereço (padrão `http://localhost:11434`), escolha o modelo na lista e clique em **Salvar**.',
      'Clique em **Testar conexão**. Pronto: o Canal Polaris, os resumos e as sugestões com IA passam a funcionar.',
    ],
    notes: ['Tudo é processado no seu PC: nenhuma conversa sai para a internet.'],
  },
  async test({ config }) {
    if (!config.url) throw new IntegrationConfigError('Informe o endereço do Ollama.');
    const models = await listModels(config.url);
    if (models.length === 0) {
      return {
        ok: false,
        message: 'O Ollama respondeu, mas não há modelos instalados. Rode "ollama pull llama3.2:3b".',
      };
    }
    if (!config.model)
      return { ok: false, message: `${models.length} modelo(s) encontrado(s). Escolha um e salve.` };
    if (!models.some((m) => m.name === config.model)) {
      return { ok: false, message: `O modelo "${config.model}" não está instalado. Escolha outro na lista.` };
    }
    return { ok: true, message: `Conectado: modelo ${config.model} pronto (${models.length} instalado[s]).` };
  },
});
