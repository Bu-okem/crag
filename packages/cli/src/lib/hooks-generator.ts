import { promises as fs } from 'fs';
import { join } from 'path';

interface ServiceMethod {
  serviceName: string;
  methodName: string;
  httpMethod: string;
  parameters: string;
  returnType: string;
  fullSignature: string;
}

export async function generateHooks(apiOutputDir: string, hooksOutputDir: string) {
    try {
        // Step 1: Read the generated services file
        const sdkFilePath = join(apiOutputDir, 'sdk.gen.ts');
    
        // Check if file exists
        console.log('🔍 Looking for SDK file at:', sdkFilePath);
    
        const sdkContent = await fs.readFile(sdkFilePath, 'utf-8');
        
        // Step 2: Parse service methods
        const serviceMethods = parseServiceMethods(sdkContent);

        console.log('📋 Found service methods:', serviceMethods.length);
    
        // Generate hooks
        const queryHooks: string[] = [];
        const mutationHooks: string[] = [];
        
        serviceMethods.forEach(method => {
        if (method.httpMethod === 'GET') {
            queryHooks.push(generateQueryHook(method));
        } else {
            mutationHooks.push(generateMutationHook(method));
        }
        });
        
        // Create hooks directory
        await fs.mkdir(hooksOutputDir, { recursive: true });
        
        // Generate the hooks file
        const hooksFileContent = generateHooksFile(queryHooks, mutationHooks, serviceMethods);
        
        await fs.writeFile(join(hooksOutputDir, 'index.ts'), hooksFileContent);
        
        console.log('🎉 Generated hooks file with', serviceMethods.length, 'hooks');
    
  } catch (error: any) {
        console.error('❌ Error:', error.message);
  }

}

function parseServiceMethods(sdkContent: string): ServiceMethod[] {
    const methods: ServiceMethod[] = [];
    
    // export const functionName = <ThrowOnError extends boolean = false>(options?: Options<DataType, ThrowOnError>) => {
    const functionRegex = /export\s+const\s+(\w+)\s*=\s*<[^>]+>\s*\(\s*options\?\:\s*Options<(\w+),\s*[^>]+>\s*\)\s*=>/g;
    let match;
    
    while ((match = functionRegex.exec(sdkContent)) !== null) {
      const methodName = match[1]; // "postAccessRegisterLearner"
      const dataType = match[2]; // "PostAccessRegisterLearnerData"
      
      // Determine HTTP method from method name prefix
      const httpMethod = determineHttpMethodFromName(methodName);
      
      methods.push({
        serviceName: 'SDK',
        methodName,
        httpMethod,
        parameters: `options?: Options<${dataType}, ThrowOnError>`,
        returnType: 'Promise<Response>', // Generic for now
        fullSignature: `${methodName}(options?: Options<${dataType}, ThrowOnError>)`
      });
    }
    
    return methods;
}
  
function determineHttpMethodFromName(methodName: string): string {
    // Extract HTTP method from the function name prefix
    if (methodName.startsWith('get')) {
      return 'GET';
    }
    if (methodName.startsWith('post')) {
      return 'POST';
    }
    if (methodName.startsWith('patch')) {
      return 'PATCH';
    }
    if (methodName.startsWith('put')) {
      return 'PUT';
    }
    if (methodName.startsWith('delete')) {
      return 'DELETE';
    }
    
    // Fallback
    return 'GET';
}

function generateQueryHook(method: ServiceMethod): string {
    const hookName = `use${capitalize(method.methodName)}`;
    
    return `
  export const ${hookName} = (options?: Parameters<typeof ${method.methodName}>[0]) => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
  
    const execute = useCallback(async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await ${method.methodName}(options);
        setData(result);
        return result;
      } catch (err: any) {
        const errorMessage = err?.message || 'An error occurred';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    }, [options]);
  
    useEffect(() => {
      execute();
    }, [execute]);
  
    return { data, loading, error, refetch: execute };
  };`;
}
  
function generateMutationHook(method: ServiceMethod): string {
    const hookName = `use${capitalize(method.methodName)}`;
    
    return `
  export const ${hookName} = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
  
    const mutate = useCallback(async (options?: Parameters<typeof ${method.methodName}>[0]) => {
      setLoading(true);
      setError(null);
      try {
        const result = await ${method.methodName}(options);
        return result;
      } catch (err: any) {
        const errorMessage = err?.message || 'An error occurred';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    }, []);
  
    return { mutate, loading, error };
  };`;
}
  
function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function generateHooksFile(queryHooks: string[], mutationHooks: string[], methods: ServiceMethod[]): string {
    const imports = `import { useState, useEffect, useCallback } from 'react';
  import { ${methods.map(m => m.methodName).join(', ')} } from '../sdk.gen';
  
  `;
  
    const allHooks = [...queryHooks, ...mutationHooks].join('\n');
    
    return imports + allHooks;
}