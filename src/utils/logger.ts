/**
 * Função utilitária para fazer logs formatados como JSON
 */
export const logJson = (label: string, data: any) => {
	console.log(`\n📋 ${label}:`);
	console.log(JSON.stringify(data, null, 2));
};

/**
 * Função utilitária para fazer logs de requisições HTTP
 */
export const logRequest = (method: string, url: string, data?: any) => {
	const logData = {
		timestamp: new Date().toISOString(),
		method,
		url,
		...(data && { body: data }),
	};
	console.log(`\n🚀 Request:`);
	console.log(JSON.stringify(logData, null, 2));
};

/**
 * Função utilitária para fazer logs de respostas HTTP
 */
export const logResponse = (status: number, data: any) => {
	const logData = {
		timestamp: new Date().toISOString(),
		status,
		data,
	};
	console.log(`\n✅ Response:`);
	console.log(JSON.stringify(logData, null, 2));
};

/**
 * Função utilitária para fazer logs de erros
 */
export const logError = (label: string, error: any) => {
	const logData = {
		timestamp: new Date().toISOString(),
		label,
		error: {
			message: error?.message || String(error),
			name: error?.name || "Error",
			stack: error?.stack,
			...(error?.response && {
				response: {
					status: error.response.status,
					statusText: error.response.statusText,
					data: error.response.data,
				},
			}),
		},
	};
	console.log(`\n❌ Error:`);
	console.log(JSON.stringify(logData, null, 2));
};

/**
 * Função utilitária para fazer logs de informações gerais
 */
export const logInfo = (label: string, data: any) => {
	const logData = {
		timestamp: new Date().toISOString(),
		label,
		data,
	};
	console.log(`\nℹ️  Info:`);
	console.log(JSON.stringify(logData, null, 2));
};

