<?php

namespace App\Events;

use App\Models\EtapeWorkflow;
use App\Models\InstanceWorkflow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class WorkflowApprovalRequested
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public InstanceWorkflow $instance,
        public EtapeWorkflow $etape,
    ) {}
}
