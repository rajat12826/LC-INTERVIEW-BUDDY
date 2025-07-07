import DodoPayments from "dodopayments";

export const dodopayments=new DodoPayments({
bearerToken: process.env.DODO_ENVIRONMENT=="dev"? process.env.DODO_PAYMENTS_API_KEY_TEST : process.env.DODO_API_KEY_LIVE,
environment: process.env.DODO_ENVIRONMENT=="dev"? "live_mode":"test_mode", 
})