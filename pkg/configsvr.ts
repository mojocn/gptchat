export const getCfgSvr = (): CfgSvr => {
    if (typeof process === "undefined") {
        throw Error(
            "[Server Config] you are importing a nodejs-only module outside of nodejs",
        );
    }
    return {
        azureOpenAiKey: process.env.AZURE_OPEN_AI_KEY,
        azureOpenAiEndpoint: process.env.AZURE_OPEN_AI_ENDPOINT,
    };
};

interface CfgSvr {
    azureOpenAiKey?: string
    azureOpenAiEndpoint?: string
}