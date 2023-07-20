//LemonOrder https://docs.lemonsqueezy.com/api/orders#the-order-object
export interface LemonOrderData {
    type: string;
    id: string;
    attributes: Attributes;
}

export interface Attributes {
    store_id: number;
    customer_id: number;
    identifier: string;
    order_number: number;
    user_name: string;
    user_email: string;
    currency: string;
    currency_rate: string;
    subtotal: number;
    discount_total: number;
    tax: number;
    total: number;
    subtotal_usd: number;
    discount_total_usd: number;
    tax_usd: number;
    total_usd: number;
    tax_name: string;
    tax_rate: string;
    status: string;
    status_formatted: string;
    refunded: boolean;
    refunded_at: null;
    subtotal_formatted: string;
    discount_total_formatted: string;
    tax_formatted: string;
    total_formatted: string;
    first_order_item: FirstOrderItem;
    urls: Urls;
    created_at: Date;
    updated_at: Date;
}

interface FirstOrderItem {
    id: number;
    order_id: number;
    product_id: number;
    variant_id: number;
    product_name: string;
    variant_name: string;
    price: number;
    created_at: Date;
    updated_at: Date;
    test_mode: boolean;
}

interface Urls {
    receipt: string;
}

export interface LemonOrderMeta {
    event_name: string
    custom_data: { uid?: string }
}


//https://docs.lemonsqueezy.com/help/checkout/prefilling-checkout-fields
export function lemonCheckoutURL(email: string, uid: number): string {
    //https://mojoai.lemonsqueezy.com/checkout/buy/6b6eb043-84a8-4654-9d1d-06a16db15424?checkout[name]=JJJJERK&checkout[email]=jjl@fglafg.com
    return `https://mojoai.lemonsqueezy.com/checkout/buy/6b6eb043-84a8-4654-9d1d-06a16db15424?checkout[email]=${email}&checkout[custom][uid]=${uid}`
}