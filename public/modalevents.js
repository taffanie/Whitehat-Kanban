$('#taskedit-modal').on('show.bs.modal', function (event) {
    if (readonly){
        return false
    }
    var trigger = $(event.relatedTarget)
    var taskname = trigger.find('#taskname').text()
    var modal = $(this)
    modal.find('#title').text('Edit ' + taskname)
    modal.find('#task-name').val(taskname)
    modal.find('#task-id').val(trigger.parent().attr('id'))
})

$('#boardedit-modal').on('show.bs.modal', function (event) {
    if (readonly){
        return false
    }
    var boardname = $('#boardtitle').text()
    var boarddesc = $('#boarddesc').text()
    $(this).find('#title').text('Edit ' + boardname)
    $('#board-id').val(window.location.pathname.split('/')[2])
    $('#board-title').val(boardname)
    $('#board-description').val(boarddesc)
})


$('#addtask-modal').on('show.bs.modal', function (event) {
    if (readonly){
        return false
    }
    var modal = $(this)
    modal.find('#taskname').val("")
})

$('#addcollab-modal').on('show.bs.modal', function (event) {
    if (readonly){
        return false
    }
})