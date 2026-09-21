// Contrato: pethood-backend/docs/specs/015-soporte.md §4.

export interface FaqPublica {
  id: number;
  pregunta: string;
  respuesta: string;
  orden: number;
}

export interface CategoriaPublica {
  id: number;
  nombre: string;
  descripcion: string | null;
  faqs: FaqPublica[];
}

export interface Categoria {
  id: number;
  nombre: string;
  descripcion: string | null;
}

export interface Faq extends FaqPublica {
  faqCategoriaId: number;
}

export interface CategoriaBody {
  nombre: string;
  descripcion?: string;
}

export interface FaqBody {
  pregunta: string;
  respuesta: string;
  orden: number;
  faqCategoriaId: number;
}

export interface ConsultaBody {
  nombreCompleto: string;
  email: string;
  asunto: string;
  mensaje: string;
}

export interface Consulta extends ConsultaBody {
  id: number;
  resuelta: boolean;
  fechaAlta: string;
}
