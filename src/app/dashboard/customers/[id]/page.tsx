"use client";

import { CustomerProfile } from "@/components/Customer/CustomerProfile";

interface Props {
    params: {
        id: string;
    };
}

export default function CustomerProfilePage({ params }: Props) {
    return <CustomerProfile id={params.id} />;
}
