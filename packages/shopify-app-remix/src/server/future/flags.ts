export interface FutureFlags {
  /**
   * When enabled, returns the same `admin` context (`AdminApiContext`) from `authenticate.webhook` that is returned from `authenticate.admin`.
   *
   * @default false
   */
  v3_webhookAdminContext?: boolean;
}

export type FutureFlagOptions = FutureFlags | undefined;

export type FeatureEnabled<
  Future extends FutureFlagOptions,
  Flag extends keyof FutureFlags,
> = Future extends FutureFlags
  ? Future[Flag] extends true
    ? true
    : false
  : false;