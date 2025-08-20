export type ProductAPIIn = {
    name: string;
    description: string;
    price: number;
    condition: string;
    image_urls: string[];
    seller_id: number;
    category_id: number;
    is_wanted: boolean;
    location?: string;
};

export type ProductAPIOut = ProductAPIIn & {
    product_id: number;
    created_at: string;
    updated_at: string;
    approve_status?: string;
    rejection_reason?: string;
    status?: string;
};
