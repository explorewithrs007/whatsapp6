export type TemplateVariableContext = {
  assignedAgent?: string;
  businessName?: string;
  contactName?: string;
  conversationStatus?: string;
  customAttributes?: Record<string, string>;
  email?: string;
  phoneNumber?: string;
  variableSamples?: Record<string, string>;
};

export type TemplateVariableGroup = "Contact" | "Conversation" | "Custom Attributes" | "System" | "Business";

export type TemplateVariableDefinition = {
  group: TemplateVariableGroup;
  key: string;
  label: string;
  token: string;
  resolveSample: (context: TemplateVariableContext) => string | undefined;
};

export const supportedTemplateVariables: TemplateVariableDefinition[] = [
  {
    group: "Contact",
    key: "contact_name",
    label: "Contact Name",
    token: "{{contact_name}}",
    resolveSample: (context) => context.contactName,
  },
  {
    group: "Contact",
    key: "phone_number",
    label: "Phone Number",
    token: "{{phone_number}}",
    resolveSample: (context) => context.phoneNumber,
  },
  {
    group: "Contact",
    key: "email",
    label: "Email",
    token: "{{email}}",
    resolveSample: (context) => context.email,
  },
  {
    group: "Conversation",
    key: "assigned_agent",
    label: "Assigned Agent",
    token: "{{assigned_agent}}",
    resolveSample: (context) => context.assignedAgent,
  },
  {
    group: "Conversation",
    key: "conversation_status",
    label: "Conversation Status",
    token: "{{conversation_status}}",
    resolveSample: (context) => context.conversationStatus,
  },
  {
    group: "Custom Attributes",
    key: "city",
    label: "City",
    token: "{{city}}",
    resolveSample: (context) => normalizeAttributes(context.customAttributes).city,
  },
  {
    group: "Custom Attributes",
    key: "requirement",
    label: "Requirement",
    token: "{{requirement}}",
    resolveSample: (context) => normalizeAttributes(context.customAttributes).requirement,
  },
  {
    group: "Custom Attributes",
    key: "budget",
    label: "Budget",
    token: "{{budget}}",
    resolveSample: (context) => normalizeAttributes(context.customAttributes).budget,
  },
  {
    group: "Custom Attributes",
    key: "customer_type",
    label: "Customer Type",
    token: "{{customer_type}}",
    resolveSample: (context) => normalizeAttributes(context.customAttributes).customer_type,
  },
  {
    group: "Custom Attributes",
    key: "lead_stage",
    label: "Lead Stage",
    token: "{{lead_stage}}",
    resolveSample: (context) => normalizeAttributes(context.customAttributes).lead_stage,
  },
  {
    group: "System",
    key: "current_date",
    label: "Current Date",
    token: "{{current_date}}",
    resolveSample: () =>
      new Intl.DateTimeFormat(undefined, { day: "numeric", month: "long", year: "numeric" }).format(new Date()),
  },
  {
    group: "System",
    key: "current_time",
    label: "Current Time",
    token: "{{current_time}}",
    resolveSample: () => new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date()),
  },
  {
    group: "Business",
    key: "business_name",
    label: "Business Name",
    token: "{{business_name}}",
    resolveSample: (context) => context.businessName,
  },
];

function normalizeVariableName(name: string) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function normalizeAttributes(attributes?: Record<string, string>) {
  return Object.entries(attributes ?? {}).reduce<Record<string, string>>((normalized, [key, value]) => {
    normalized[normalizeVariableName(key)] = value;
    return normalized;
  }, {});
}

export function getTemplateVariableDefinition(variable: string) {
  const normalized = normalizeVariableName(variable);
  const aliases: Record<string, string> = {
    agent_name: "assigned_agent",
    customer_name: "contact_name",
    name: "contact_name",
    phone: "phone_number",
  };
  const key = aliases[normalized] ?? normalized;
  return supportedTemplateVariables.find((definition) => definition.key === key);
}

export function getTemplateVariableSample(variable: string, context: TemplateVariableContext) {
  const normalized = normalizeVariableName(variable);
  const variableSamples = normalizeAttributes(context.variableSamples);
  const sampleValue = variableSamples[normalized];
  const definition = getTemplateVariableDefinition(normalized);

  return sampleValue ?? definition?.resolveSample(context);
}

export function resolveTemplateVariables(templateBody: string, context: TemplateVariableContext) {
  const customAttributes = normalizeAttributes(context.customAttributes);
  const variableSamples = normalizeAttributes(context.variableSamples);
  const knownValues: Record<string, string | undefined> = {
    agent_name: context.assignedAgent,
    assigned_agent: context.assignedAgent,
    business_name: context.businessName,
    contact_name: context.contactName,
    conversation_status: context.conversationStatus,
    customer_name: context.contactName,
    email: context.email,
    name: context.contactName,
    phone: context.phoneNumber,
    phone_number: context.phoneNumber,
  };

  return templateBody.replace(/{{\s*([A-Za-z0-9_]+)\s*}}/g, (_match, rawVariable: string) => {
    const variable = normalizeVariableName(rawVariable);
    const definition = getTemplateVariableDefinition(variable);
    const value =
      knownValues[variable] ??
      customAttributes[variable] ??
      variableSamples[variable] ??
      definition?.resolveSample(context);

    return value?.trim() ? value : `[${variable}]`;
  });
}
