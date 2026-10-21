// Mensagem temporária para scripts que só passam a funcionar em etapas futuras.
const command = process.argv[2] ?? 'este comando';
console.log(`ℹ️  "${command}" ainda não está disponível: o banco de dados chega na Etapa 2.`);
