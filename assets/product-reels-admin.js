/* global wp, ProductReels, ajaxurl */
(function ($) {
  'use strict';

  const { ajaxurl, nonce, i18n } = ProductReels;

  /* -----------------------------------------------------------------------
   * Tab switching
   * -------------------------------------------------------------------- */
  $(document).on('click', '.pr-tab', function () {
    const $tab = $(this);
    const panel = $tab.data('tab');

    $tab.siblings('.pr-tab').removeClass('is-active').attr('aria-selected', 'false');
    $tab.addClass('is-active').attr('aria-selected', 'true');

    $('.pr-tab-panel').removeClass('is-active');
    $('[data-panel="' + panel + '"]').addClass('is-active');

    $('#pr_video_source').val(panel);
  });

  /* -----------------------------------------------------------------------
   * Preview clip toggle
   * -------------------------------------------------------------------- */
  $('#pr_preview_enabled').on('change', function () {
    $('#pr_preview_options').toggle(this.checked);
  });

  /* -----------------------------------------------------------------------
   * Media library picker – Video upload
   * -------------------------------------------------------------------- */
  let videoFrame = null;

  $('#pr_upload_btn').on('click', function () {
    if (videoFrame) {
      videoFrame.open();
      return;
    }
    videoFrame = wp.media({
      title:    i18n.selectVideo,
      button:   { text: i18n.useVideo },
      library:  { type: 'video' },
      multiple: false,
    });

    videoFrame.on('select', function () {
      const att = videoFrame.state().get('selection').first().toJSON();
      $('#pr_video_attachment_id').val(att.id);

      // Update upload area preview
      const $area = $('#pr_upload_area');
      $area.html(
        '<video src="' + escAttr(att.url) + '" controls muted class="pr-upload-preview"></video>' +
        '<p class="pr-upload-filename">' + escHtml(att.filename || att.url.split('/').pop()) + '</p>'
      );

      // Rename button
      $('#pr_upload_btn').text(i18n.changeVideo);
    });

    videoFrame.open();
  });

  /* Remove video */
  $(document).on('click', '#pr_remove_video_btn', function () {
    $('#pr_video_attachment_id').val('');
    $('#pr_upload_area').html(
      '<div class="pr-upload-placeholder">' +
      '<span class="dashicons dashicons-video-alt3"></span>' +
      '<p>' + escHtml(i18n.noVideoSelected) + '</p>' +
      '</div>'
    );
    $('#pr_upload_btn').text(i18n.selectUploadVideo);
    $(this).remove();
  });

  /* -----------------------------------------------------------------------
   * Media library picker – Thumbnail image
   * -------------------------------------------------------------------- */
  let thumbFrame = null;

  $('#pr_upload_thumb_btn').on('click', function () {
    if (thumbFrame) {
      thumbFrame.open();
      return;
    }
    thumbFrame = wp.media({
      title:    i18n.selectImage,
      button:   { text: i18n.useImage },
      library:  { type: 'image' },
      multiple: false,
    });

    thumbFrame.on('select', function () {
      const att = thumbFrame.state().get('selection').first().toJSON();
      setThumbnail(att.id, att.url);
    });

    thumbFrame.open();
  });

  /* Remove thumbnail */
  $(document).on('click', '#pr_remove_thumb_btn', function () {
    $('#pr_thumbnail_id').val('');
    $('#pr_thumb_preview').html(
      '<div class="pr-thumb-empty">' +
      '<span class="dashicons dashicons-format-image"></span>' +
      '<p>' + escHtml(i18n.noThumbnail) + '</p></div>'
    );
    $(this).remove();
  });

  /* -----------------------------------------------------------------------
   * Generate thumbnail via AJAX
   * -------------------------------------------------------------------- */
  $('#pr_gen_thumb_btn').on('click', function () {
    const postId = $(this).data('post');
    if (!postId || postId === 0 || postId === '0') {
      showFeedback('#pr_thumb_feedback', i18n.savingFirst, false);
      return;
    }
    runGenerate('thumbnail', postId, '#pr_thumb_spinner', '#pr_thumb_feedback', '#pr_gen_thumb_btn', function (data) {
      setThumbnail(data.attachment_id, data.url);
    });
  });

  /* -----------------------------------------------------------------------
   * Generate preview clip via AJAX
   * -------------------------------------------------------------------- */
  $('#pr_gen_preview_btn').on('click', function () {
    const postId = $(this).data('post');
    if (!postId || postId === 0 || postId === '0') {
      showFeedback('#pr_preview_feedback', i18n.savingFirst, false);
      return;
    }
    runGenerate('preview', postId, '#pr_preview_spinner', '#pr_preview_feedback', '#pr_gen_preview_btn', function (data) {
      $('#pr_preview_attachment_id').val(data.attachment_id);
      // Update preview area
      const $existing = $('.pr-preview-current');
      const html =
        '<div class="pr-preview-current">' +
        '<video src="' + escAttr(data.url) + '" muted autoplay loop playsinline class="pr-upload-preview" style="max-width:120px"></video>' +
        '<span class="pr-preview-label">' + escHtml(i18n.currentPreviewClip) + '</span>' +
        '</div>';
      if ($existing.length) {
        $existing.replaceWith(html);
      } else {
        $('#pr_gen_preview_btn').before(html);
      }
    });
  });

  /* -----------------------------------------------------------------------
   * Helpers
   * -------------------------------------------------------------------- */
  function runGenerate(action, postId, spinnerSel, feedbackSel, btnSel, onSuccess) {
    const $btn     = $(btnSel);
    const $spinner = $(spinnerSel);
    const $icon    = $btn.find('.dashicons');

    $btn.prop('disabled', true).addClass('is-loading');
    $icon.addClass('dashicons-update-alt').removeClass('dashicons-update');
    $spinner.show();
    showFeedback(feedbackSel, i18n.generating, null);

    $.post(ajaxurl, {
      action:   'product_reels_generate_assets',
      nonce:    nonce,
      post_id:  postId,
      generate: action,
    })
    .done(function (res) {
      if (res.success) {
        showFeedback(feedbackSel, res.data.message, true);
        onSuccess(res.data);
      } else {
        showFeedback(feedbackSel, res.data.message || i18n.error, false);
      }
    })
    .fail(function () {
      showFeedback(feedbackSel, i18n.serverErrorTryAgain, false);
    })
    .always(function () {
      $btn.prop('disabled', false).removeClass('is-loading');
      $icon.addClass('dashicons-update').removeClass('dashicons-update-alt');
      $spinner.hide();
    });
  }

  function setThumbnail(id, url) {
    $('#pr_thumbnail_id').val(id);
    $('#pr_thumb_preview').html('<img src="' + escAttr(url) + '" alt="" style="width:100%;height:100%;object-fit:cover">');
    // Ensure remove button exists
    if (!$('#pr_remove_thumb_btn').length) {
      $('#pr_upload_thumb_btn').after(
        ' <button type="button" class="button pr-btn-link" id="pr_remove_thumb_btn">' + escHtml(i18n.removeThumbnail) + '</button>'
      );
    }
  }

  function showFeedback(sel, msg, success) {
    const $el = $(sel);
    $el.removeClass('is-success is-error').text(msg);
    if (success === true)  $el.addClass('is-success');
    if (success === false) $el.addClass('is-error');
  }

  function escAttr(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /* -----------------------------------------------------------------------
   * Settings page: FFmpeg downloader
   * -------------------------------------------------------------------- */
  const $downloadBtn = $('#pr_download_ffmpeg_btn');
  const $removeBtn   = $('#pr_remove_ffmpeg_btn');
  const $progress    = $('#pr_download_progress');
  const $bar         = $('#pr_progress_bar');
  const $status      = $('#pr_download_status');

  if ($downloadBtn.length) {
    $downloadBtn.on('click', function () {
      const nonce = $(this).data('nonce');

      $downloadBtn.prop('disabled', true).text(i18n.downloading);
      if ($removeBtn.length) $removeBtn.prop('disabled', true);

      $progress.show();
      $bar.addClass('is-indeterminate');
      $status.text(i18n.downloadStatus);

      $.post(ajaxurl, {
        action: 'product_reels_download_ffmpeg',
        nonce:  nonce,
      })
      .done(function (res) {
        $bar.removeClass('is-indeterminate').css('width', '100%');
        if (res.success) {
          $status.css('color', '#0a7227').html('✔ ' + escHtml(res.data.message) + '<br><strong>' + escHtml(i18n.reloading) + '</strong>');
          setTimeout(() => location.reload(), 1800);
        } else {
          $status.css('color', '#d63638').text('✘ ' + (res.data?.message || i18n.unknownError));
          $downloadBtn.prop('disabled', false).text(i18n.retryDownload);
          if ($removeBtn.length) $removeBtn.prop('disabled', false);
        }
      })
      .fail(function (xhr) {
        $bar.removeClass('is-indeterminate');
        $status.css('color', '#d63638').text('✘ ' + i18n.downloadTimedOut.replace('%d', xhr.status));
        $downloadBtn.prop('disabled', false).text(i18n.retryDownload);
        if ($removeBtn.length) $removeBtn.prop('disabled', false);
      });
    });
  }

  if ($removeBtn.length) {
    $removeBtn.on('click', function () {
      if (!confirm(i18n.removeFfmpegConfirm)) return;
      const nonce = $(this).data('nonce');
      $removeBtn.prop('disabled', true).text(i18n.removing);
      $.post(ajaxurl, { action: 'product_reels_remove_ffmpeg', nonce })
        .done(function (res) {
          if (res.success) location.reload();
          else alert(res.data?.message || i18n.errorRemovingBinary);
        })
        .fail(() => { alert(i18n.serverError); $removeBtn.prop('disabled', false); });
    });
  }

  /* -----------------------------------------------------------------------
   * Settings page: FFmpeg diagnostic / troubleshooting test
   * -------------------------------------------------------------------- */
  const $testBtn     = $('#pr_test_ffmpeg_btn');
  const $testResults = $('#pr_test_results');

  if ($testBtn.length) {
    const idleLabel = $testBtn.text();

    $testBtn.on('click', function () {
      const nonce = $(this).data('nonce');
      $testBtn.prop('disabled', true).text(i18n.runningTest || '⏳ Running test…');
      $testResults.hide().empty();

      $.post(ajaxurl, {
        action: 'product_reels_test_ffmpeg',
        nonce:  nonce,
      })
      .done(function (res) {
        $testBtn.prop('disabled', false).text(idleLabel);
        if (!res.success) {
          $testResults.html(renderTestBanner(false, res.data?.message || i18n.error)).show();
          return;
        }
        $testResults.html(renderTestReport(res.data)).show();
      })
      .fail(function () {
        $testBtn.prop('disabled', false).text(idleLabel);
        $testResults.html(renderTestBanner(false, i18n.serverError)).show();
      });
    });
  }

  function renderTestBanner(ok, msg) {
    return '<div class="pr-status-banner ' + (ok ? 'pr-status-banner--ok' : 'pr-status-banner--error') + '">' +
      '<span class="pr-status-icon">' + (ok ? '✔' : '✘') + '</span>' +
      '<div><strong>' + escHtml(msg) + '</strong></div></div>';
  }

  function renderTestReport(d) {
    const rows = [
      ['exec() / shell_exec() enabled', d.exec_enabled && d.shell_exec_enabled],
      ['FFmpeg binary found', !!d.ffmpeg_path],
      ['FFmpeg runs (-version)', d.version_ok],
      ['Test encode (libx264)', d.encode_ok],
      ['Frame extraction', d.frame_ok],
    ];

    let html = '<table class="pr-sysinfo-table">';
    rows.forEach(function (row) {
      const label = row[0];
      const ok = row[1];
      html += '<tr><th>' + escHtml(label) + '</th><td>' +
        (ok ? '<span style="color:#0a7227">✔ OK</span>' : '<span style="color:#d63638">✘ Failed</span>') +
        '</td></tr>';
    });
    if (d.ffmpeg_path) {
      html += '<tr><th>Path</th><td><code>' + escHtml(d.ffmpeg_path) + '</code> (' + escHtml(d.ffmpeg_source || '') + ')</td></tr>';
    }
    html += '</table>';

    if (d.fatal) {
      html += '<div class="pr-notice pr-notice--warning" style="margin-top:14px">' + escHtml(d.fatal) + '</div>';
    }

    const outputs = [
      ['FFmpeg version output', d.version_output],
      ['Test encode output', d.encode_output],
      ['Frame extraction output', d.frame_output],
    ].filter(function (pair) { return !!pair[1]; });

    if (outputs.length) {
      html += '<details style="margin-top:12px"><summary style="cursor:pointer;font-weight:600">Raw output (include this in support requests)</summary>';
      outputs.forEach(function (pair) {
        html += '<p class="pr-muted" style="margin:10px 0 2px">' + escHtml(pair[0]) + '</p>' +
          '<pre class="pr-code-block" style="display:block;white-space:pre-wrap;word-break:break-all">' + escHtml(pair[1]) + '</pre>';
      });
      html += '</details>';
    }

    return html;
  }

}(jQuery));
