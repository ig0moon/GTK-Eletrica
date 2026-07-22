-- ============================================================
-- GTK Elétrica e Info — schema + RLS por papel
-- ------------------------------------------------------------
-- Rode isto no SQL Editor do seu projeto Supabase depois de
-- preencher GTK_CONFIG.supabaseUrl e supabaseAnonKey em
-- js/config.js e trocar o mock de js/auth.js pelas chamadas
-- reais de supabase-js.
--
-- Papéis (role em "profiles"):
--   admin        -> equipe GTK, acesso total (catálogo, usuários, agendamentos)
--   colaborador  -> técnicos, veem só os agendamentos atribuídos a eles
--   cliente      -> usuários finais, veem só os próprios agendamentos
--
-- Importante: RLS é a barreira de segurança real. Qualquer
-- verificação de papel feita no front-end (esconder um botão,
-- redirecionar de uma página "/admin") é só UX — o banco tem
-- que recusar a operação mesmo que alguém chame a API direto.
-- ============================================================

-- ---------- PERFIS (espelha auth.users + papel) ----------
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null,
  telefone text,
  role text not null default 'cliente' check (role in ('admin', 'colaborador', 'cliente')),
  criado_em timestamptz not null default now()
);

alter table profiles enable row level security;

-- função utilitária: papel do usuário autenticado
create or replace function current_role_gtk()
returns text
language sql
stable
security definer
as $$
  select role from profiles where id = auth.uid();
$$;

create policy "usuário vê o próprio perfil, admin vê todos"
  on profiles for select
  using (id = auth.uid() or current_role_gtk() = 'admin');

create policy "usuário edita o próprio perfil"
  on profiles for update
  using (id = auth.uid());

create policy "admin edita qualquer perfil"
  on profiles for update
  using (current_role_gtk() = 'admin');

-- novo usuário sempre entra como cliente; promover a admin/colaborador
-- é feito manualmente (painel do Supabase ou por um admin autenticado)
create policy "cadastro cria o próprio perfil como cliente"
  on profiles for insert
  with check (id = auth.uid());


-- ---------- SERVIÇOS (catálogo) ----------
create table if not exists servicos (
  id text primary key,
  categoria text not null check (categoria in ('elec', 'ti')),
  nome text not null,
  descricao text,
  preco numeric(10,2) not null,
  ativo boolean not null default true
);

alter table servicos enable row level security;

create policy "catálogo ativo é público"
  on servicos for select
  using (ativo = true or current_role_gtk() = 'admin');

create policy "só admin gerencia o catálogo"
  on servicos for insert with check (current_role_gtk() = 'admin');

create policy "só admin edita o catálogo"
  on servicos for update using (current_role_gtk() = 'admin');

create policy "só admin remove do catálogo"
  on servicos for delete using (current_role_gtk() = 'admin');


-- ---------- AGENDAMENTOS ----------
create table if not exists agendamentos (
  id text primary key,
  cliente_id uuid not null references profiles (id),
  colaborador_id uuid references profiles (id),
  data date not null,
  horario text not null,
  endereco text not null,
  observacoes text,
  forma_pagamento text,
  status text not null default 'pendente' check (status in ('pendente','confirmado','em_andamento','concluido','cancelado')),
  total numeric(10,2) not null default 0,
  criado_em timestamptz not null default now()
);

alter table agendamentos enable row level security;

create policy "cliente vê e cria os próprios agendamentos"
  on agendamentos for select using (cliente_id = auth.uid());

create policy "cliente cria agendamento para si mesmo"
  on agendamentos for insert with check (cliente_id = auth.uid());

create policy "colaborador vê os agendamentos atribuídos a ele"
  on agendamentos for select using (colaborador_id = auth.uid());

create policy "colaborador atualiza status dos seus agendamentos"
  on agendamentos for update using (colaborador_id = auth.uid());

create policy "admin vê e gerencia todos os agendamentos"
  on agendamentos for all using (current_role_gtk() = 'admin');


-- ---------- ITENS DO AGENDAMENTO ----------
create table if not exists agendamento_itens (
  id bigint generated always as identity primary key,
  agendamento_id text not null references agendamentos (id) on delete cascade,
  servico_id text not null references servicos (id),
  quantidade int not null default 1,
  preco_unitario numeric(10,2) not null
);

alter table agendamento_itens enable row level security;

create policy "itens seguem a visibilidade do agendamento"
  on agendamento_itens for select
  using (
    exists (
      select 1 from agendamentos a
      where a.id = agendamento_itens.agendamento_id
        and (a.cliente_id = auth.uid() or a.colaborador_id = auth.uid() or current_role_gtk() = 'admin')
    )
  );

create policy "cliente insere itens do próprio agendamento"
  on agendamento_itens for insert
  with check (
    exists (
      select 1 from agendamentos a
      where a.id = agendamento_itens.agendamento_id and a.cliente_id = auth.uid()
    )
  );
