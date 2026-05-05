
<?php
    $docCount  = count($node['documents']);
    $enfantCount = count($node['enfants']);
    $totalCount = $docCount + $enfantCount;
?>

<div class="tree-node">
    <?php if(!isset($root) || !$root): ?>
    <div class="folder-row">
        <span class="folder-dot" style="background: <?php echo e($node['couleur']); ?>;"></span>
        <span class="folder-name"><?php echo e($node['nom']); ?></span>
        <span class="folder-counts">
            <?php if($docCount > 0): ?><?php echo e($docCount); ?> doc<?php echo e($docCount > 1 ? 's' : ''); ?><?php endif; ?>
            <?php if($docCount > 0 && $enfantCount > 0): ?> &bull; <?php endif; ?>
            <?php if($enfantCount > 0): ?><?php echo e($enfantCount); ?> sous-dossier<?php echo e($enfantCount > 1 ? 's' : ''); ?><?php endif; ?>
            <?php if($totalCount === 0): ?><em>vide</em><?php endif; ?>
        </span>
    </div>
    <?php endif; ?>

    
    <?php if($docCount > 0): ?>
    <div class="doc-list <?php echo e(!isset($root) || !$root ? 'children' : ''); ?>" style="<?php echo e((!isset($root) || !$root) ? 'border-left-color: '.$node['couleur'].';' : ''); ?>">
        <?php $__currentLoopData = $node['documents']; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $doc): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
        <div class="doc-item">
            <span class="doc-ext"><?php echo e($doc['extension'] ?: 'FILE'); ?></span>
            <span class="doc-title" title="<?php echo e($doc['titre']); ?>"><?php echo e($doc['titre']); ?></span>
            <span class="doc-meta">
                <?php echo e($doc['taille_formatee']); ?>

                <?php if($doc['numero_document']): ?>
                    &bull; <?php echo e($doc['numero_document']); ?>

                <?php endif; ?>
                <?php if($doc['date_document']): ?>
                    &bull; <?php echo e(\Carbon\Carbon::parse($doc['date_document'])->format('d/m/Y')); ?>

                <?php endif; ?>
            </span>
        </div>
        <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
    </div>
    <?php endif; ?>

    
    <?php if($enfantCount > 0): ?>
    <div class="children" style="border-left-color: <?php echo e($node['couleur']); ?>;">
        <?php $__currentLoopData = $node['enfants']; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $enfant): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
            <?php echo $__env->make('partials.dossier_node', ['node' => $enfant, 'root' => false], array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
        <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
    </div>
    <?php endif; ?>

    
    <?php if(isset($root) && $root && $totalCount === 0): ?>
    <p class="empty">Ce dossier est vide.</p>
    <?php endif; ?>
</div>
<?php /**PATH E:\CODING\DSTCOMPUTING\Plateforme\SEN_ARCHIVAGE\SenArhive_Sn\resources\views\partials\dossier_node.blade.php ENDPATH**/ ?>