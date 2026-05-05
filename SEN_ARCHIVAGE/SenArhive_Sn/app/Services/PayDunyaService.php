<?php

namespace App\Services;

use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class PayDunyaService
{
    public function createCheckoutInvoice(array $payload): array
    {
        $response = Http::baseUrl($this->baseUrl())
            ->withHeaders($this->headers())
            ->post($this->apiPath('checkout-invoice/create'), $payload);

        if (! $response->successful()) {
            throw new RuntimeException('Impossible de créer la facture PayDunya.');
        }

        $data = $response->json() ?? [];

        if (Arr::get($data, 'response_code') !== '00') {
            $message = Arr::get($data, 'response_text')
                ?: Arr::get($data, 'response_message')
                ?: 'La création de la facture PayDunya a échoué.';

            throw new RuntimeException($message);
        }

        return $data;
    }

    public function confirmInvoice(string $token): array
    {
        $response = Http::baseUrl($this->baseUrl())
            ->withHeaders($this->headers())
            ->get($this->apiPath('checkout-invoice/confirm/' . $token));

        if (! $response->successful()) {
            throw new RuntimeException('Impossible de confirmer la transaction PayDunya.');
        }

        $data = $response->json() ?? [];

        if (Arr::get($data, 'response_code') !== '00') {
            $message = Arr::get($data, 'response_text')
                ?: Arr::get($data, 'response_message')
                ?: 'La confirmation PayDunya a échoué.';

            throw new RuntimeException($message);
        }

        return $data;
    }

    private function headers(): array
    {
        return [
            'PAYDUNYA-MASTER-KEY' => config('services.paydunya.master_key'),
            'PAYDUNYA-PRIVATE-KEY' => config('services.paydunya.private_key'),
            'PAYDUNYA-PUBLIC-KEY' => config('services.paydunya.public_key'),
            'PAYDUNYA-TOKEN' => config('services.paydunya.token'),
            'Content-Type' => 'application/json',
            'Accept' => 'application/json',
        ];
    }

    private function apiPath(string $endpoint): string
    {
        $prefix = config('services.paydunya.sandbox', false) ? '/sandbox-api/v1/' : '/api/v1/';
        return $prefix . ltrim($endpoint, '/');
    }

    private function baseUrl(): string
    {
        return rtrim((string) config('services.paydunya.base_url', 'https://app.paydunya.com'), '/');
    }
}