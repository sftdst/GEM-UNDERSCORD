<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConfigurationMail extends Model
{
    use HasUuid;

    protected $table = 'configurations_mail';

    protected $fillable = [
        'organisation_id',
        'mailer',
        'host',
        'port',
        'username',
        'password',
        'encryption',
        'from_address',
        'from_name',
        'actif',
    ];

    protected function casts(): array
    {
        return [
            'port'    => 'integer',
            'actif'   => 'boolean',
            'password' => 'encrypted',   // chiffrement AES via APP_KEY
        ];
    }

    public function organisation(): BelongsTo
    {
        return $this->belongsTo(Organisation::class);
    }

    /**
     * Retourne la config sous forme de tableau compatible config('mail.*')
     */
    public function toMailConfig(): array
    {
        return [
            'mailers' => [
                'org_smtp' => [
                    'transport'  => 'smtp',
                    'host'       => $this->host,
                    'port'       => $this->port,
                    'username'   => $this->username,
                    'password'   => $this->password,
                    'encryption' => $this->encryption,
                ],
            ],
            'from' => [
                'address' => $this->from_address,
                'name'    => $this->from_name,
            ],
        ];
    }
}
