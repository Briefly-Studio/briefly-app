import "dotenv/config";

export default ({ config }: any) => {
  const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? "";

  return {
    ...config,
    extra: {
      ...(config.extra ?? {}),
      apiBaseUrl,
    },
  };
};
