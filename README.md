# Xavier Store — primeira versão

Aplicação web adaptável a telemóvel, com catálogo público, carrinho, encomenda via WhatsApp e painel administrativo.

## O que está preparado

- Catálogo público de produtos.
- Preços em Kz, categorias, tamanhos, fotografias e stock.
- Carrinho e preparação da mensagem de encomenda para WhatsApp.
- Registo da encomenda na base de dados.
- Login administrativo.
- Gestão de produtos: criar, editar, publicar/ocultar e eliminar.
- Consulta e actualização do estado das encomendas.
- Interface adaptada a ecrãs de telemóvel.

## Antes de publicar

Esta é uma base funcional de desenvolvimento, não uma loja já publicada. É necessário configurar o Supabase e alojar a aplicação.

### 1. Criar a base de dados

1. Criar um projecto em https://supabase.com/.
2. Abrir **SQL Editor**.
3. Executar todo o conteúdo de `supabase/schema.sql`.
4. Em **Authentication > Users**, criar o utilizador que será administrador.
5. Copiar o UUID desse utilizador e executar o `insert` comentado no fim do SQL, substituindo `UUID-DO-ADMIN`.
6. Em **Storage**, criar um bucket público chamado `product-images`.
7. Configurar as políticas de Storage para permitir upload, alteração e eliminação apenas a utilizadores para os quais `public.is_store_admin()` devolva true.

### 2. Configurar a aplicação

1. Copiar `.env.example` para `.env`.
2. No Supabase, abrir **Project Settings > API**.
3. Copiar Project URL para `VITE_SUPABASE_URL`.
4. Copiar a chave `anon` / publishable para `VITE_SUPABASE_ANON_KEY`.
5. Confirmar `VITE_WHATSAPP_NUMBER=244933049775`.

**Nunca colocar a chave `service_role` no frontend, no GitHub ou em ficheiros `.env` publicados.**

### 3. Executar no computador

Requer Node.js 20 ou superior.

```bash
npm install
npm run dev
```

Para preparar a versão de publicação:

```bash
npm run build
```

A pasta gerada será `dist/`. Pode ser publicada no Vercel ou Netlify, definindo as mesmas variáveis de ambiente no painel de configuração do alojamento.

### 4. Fotografias dos produtos

Nesta primeira versão, o campo de imagem aceita um endereço público de imagem. Para uma gestão completa pelo telemóvel, o passo seguinte é ligar o formulário de produto ao bucket `product-images`, para carregar fotografias directamente da galeria.

## Notas importantes

- O WhatsApp usado por defeito é o número comercial `+244 933 049 775`.
- O pagamento é combinado directamente com a loja pelo WhatsApp.
- As encomendas só são encaminhadas depois de serem registadas na base de dados.
- O acesso de administração depende da autenticação e do perfil `admin` na tabela `profiles`.
- Antes de receber encomendas reais, testar criação de encomenda, permissões, imagens e acesso administrativo.
