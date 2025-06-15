# KHOSTA

**Sistema de Gestão Penal** desenvolvido como projeto acadêmico na Universidade Metodista Unida de Moçambique, com o objetivo de modernizar o controle prisional através de uma aplicação web intuitiva, segura e responsiva.

> 🔒 _“KHOSTA: Controle, Segurança e Transparência na Gestão Penal”_

---

## 📖 Sobre o Projeto

**KHOSTA Penal** é um sistema web criado para facilitar a administração de estabelecimentos prisionais. O sistema centraliza informações de reclusos, visitantes e relatórios administrativos, garantindo maior **eficiência**, **transparência** e **segurança**.

Este projeto foi desenvolvido com foco em ambientes locais (offline), utilizando armazenamento local no navegador e tecnologias de frontend modernas.

---

## 🎯 Objetivos

### 🎯 Objetivo Geral

Desenvolver um sistema de gestão penal que permita o controlo eficaz de reclusos, visitantes e relatórios, com permissões de acesso diferenciadas consoante o perfil do utilizador.

### 🎯 Objetivos Específicos

- Criar uma interface funcional para registo e consulta de reclusos;
- Implementar um sistema de permissões baseado em tipos de utilizador (Administrador, Agente Prisional, Diretor);
- Gerir visitas e emitir relatórios automáticos;
- Garantir uma experiência responsiva e leve com HTML, CSS, JavaScript, Tailwind CSS e LocalStorage.

---

## 🛠️ Funcionalidades

### ✅ Funcionais

- Login com perfis diferenciados (Admin, Agente, Diretor)
- Cadastro e edição de reclusos
- Listagem e filtragem de prisioneiros
- Geração de relatórios por critérios (crime, situação penal, tempo de pena)
- Cadastro de visitantes (em desenvolvimento)
- Gerenciamento de utilizadores (somente Admin)
- Controle de permissões baseado no perfil do utilizador

### ⚙️ Não Funcionais

- Interface responsiva com TailwindCSS
- Armazenamento local via `LocalStorage`
- Feedback visual com SweetAlert2
- Código modular em JavaScript

---

## ⚙️ Tecnologias Utilizadas

| Tecnologia         | Finalidade                                     |
| ------------------ | ---------------------------------------------- |
| HTML5              | Estruturação semântica das páginas             |
| CSS3 + TailwindCSS | Estilização responsiva e moderna               |
| JavaScript         | Lógica de interação no lado do cliente         |
| LocalStorage       | Armazenamento de dados local no navegador      |
| SweetAlert2        | Notificações visuais amigáveis                 |
| Vercel             | Deploy contínuo e hospedagem online do sistema |

---

## 🌐 Deploy na Nuvem

O sistema está disponível online via [Vercel](https://vercel.com), permitindo testes e demonstrações sem necessidade de instalação.

> 🔗 **Link do sistema:** [https://khosta.vercel.app]

---

## 📊 Diagramas de Modelagem

- **📌 Casos de Uso**: Login, Cadastro de Reclusos, Gerar Relatórios, Gerenciar Utilizadores.
- **📌 Classes**: Usuário, Prisioneiro, Visitante (com atributos e métodos).
- **📌 Atividades**: Login → Dashboard → Ações conforme o perfil.
- **📌 Sequência**: Usuário → Formulário HTML → JS → LocalStorage → SweetAlert2.

---

## 📸 Interfaces do Sistema

| Interface         | Descrição                                     |
| ----------------- | --------------------------------------------- |
| `index.html`      | Tela de Login                                 |
| `dashboard.html`  | Painel Principal com atalhos por perfil       |
| `cadastro.html`   | Cadastro/Edição de Reclusos                   |
| `lista.html`      | Lista filtrável de prisioneiros               |
| `relatorios.html` | Geração de relatórios administrativos         |
| `visitantes.html` | Cadastro de Visitantes (em desenvolvimento)   |
| `admin.html`      | Gerenciamento de Utilizadores (somente Admin) |

---

## 👥 Autores

- Aquilívio Maria
- Marcos Paixão
- Letícia Jonhson
- Maica Lucía

---

**Docente Orientador**: Eng. Santos Macuma  
**Universidade Metodista Unida de Moçambique – Campus Cambine**  
**Junho de 2025**

> ⚠️ Este projeto é um protótipo acadêmico. Algumas funcionalidades como controle de visitantes e autenticação robusta ainda estão em fase de desenvolvimento.
