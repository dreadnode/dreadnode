(function(global,$){

	var $board = $("<div></div>"),
		row_names = "ABCDEFGHIJKLMNO".split(""),
		$row, $cell, $piece_position_marker, ppm_pos, my_board_offset,
		your_turn = false
	;
	
	function set_your_turn(set) {
		your_turn = set;
	}
	
	function set_target_peg(cell_id,hit) {
		global.$target_board.find("div[rel='"+cell_id+"'] a").addClass(hit?"hit":"miss");
	}
	
	function set_ship_peg(cell_id) {
		var $pieces = global.$my_board.find(".piece");
		cell_id = cell_id.split(":");
		
		$pieces.each(function(){
			var $piece = $(this), $peg;
			if ($peg = test_piece_coord($piece,cell_id[0],+(cell_id[1]))) {
				$peg.addClass("hit");
				return false;
			}				  
		});
	}
	
	function piece_conflicts() {
		var $pieces = global.$my_board.find(".piece"), conflict_found = false;
		
		$pieces.each(function(){
			var $piece = $(this), p_pos = $piece.position();
			p_pos.right = p_pos.left + $piece.width() - 3;
			p_pos.bottom = p_pos.top + $piece.height() - 1;
			if (!(
				(ppm_pos.right < p_pos.left) || (ppm_pos.left > p_pos.right) || (ppm_pos.bottom < p_pos.top) || (ppm_pos.top > p_pos.bottom)
			)) { conflict_found = true; return false; }
		});
		return conflict_found;
	}
	
	function find_valid_piece_location($piece) {
		var piece_off = $piece.offset(),
			pw = $piece.width()-2, ph = $piece.height(),
			pcw = 1 + Math.floor((pw-30)/32), pch = 1 + Math.floor((ph-30)/32),
			px1 = piece_off.left-my_board_offset.left, py1 = piece_off.top-my_board_offset.top,
			px2 = px1 + pw - 1, py2 = py1 + ph -1,
			position = {
				c1: Math.round(px1 / 32),
				c2: Math.round(px2 / 32),
				r1: Math.round(py1 / 32),
				r2: Math.round(py2 / 32)
			}
		;
		
		// constrain piece_position_marker to board
		if (position.c1 < 1) {
			position.c1 = 1;
			position.c2 = position.c1 + pcw - 1;
		}
		else if (position.c2 > 15) {
			position.c2 = 15;
			position.c1 = position.c2 - pcw + 1;
		}
		else {
			position.c2 = position.c1 + pcw - 1;
		}
		
		if (position.r1 < 1) {
			position.r1 = 1;
			position.r2 = position.r1 + pch - 1;
		}
		else if (position.r2 > 15) {
			position.r2 = 15;
			position.r1 = position.r2 - pch + 1;
		}
		else {
			position.r2 = position.r1 + pch - 1;
		}
		
		position.x1 = position.c1 * 32 + 2;
		position.y1 = position.r1 * 32 + 2;
		position.x2 = (position.c2+1) * 32 + 1;
		position.y2 = (position.r2+1) * 32 + 1;
		
		ppm_pos = {left:position.x1, top:position.y1, right:position.x2, bottom:position.y2};
		
		if (!piece_conflicts() && Math.abs(px1-position.x1) <= 50 && Math.abs(px2-position.x2) <= 50 && Math.abs(py1-position.y1) <= 50 && Math.abs(py2-position.y2) <= 50) {
			$piece_position_marker.css({left:position.x1+"px",top:position.y1+"px",width:(position.x2-position.x1-1)+"px",height:(position.y2-position.y1-1)+"px"}).show();
			return position;
		}
		$piece_position_marker.hide();
		return false;
	}
	
	function hide_piece_location_marker() {
		$piece_position_marker.hide();
	}
	
	function test_piece_coord($piece,row_coord,col_coord) {
		if (typeof row_coord == "string") {
			row_coord = row_coord.toUpperCase().charCodeAt(0) - 64;
		}
		var tl = $piece.data("top_left"),
			br = $piece.data("bottom_right"),
			cols_across = br.col - tl.col + 1,
			rows_down = br.row - tl.row + 1,
			peg_idx, col, row
		;
		for (col=tl.col; col<=br.col; col++) {
			for (row=tl.row; row<=br.row; row++) {
				if (row == row_coord && col == col_coord) {
					peg_idx = ((row-tl.row) * cols_across) + (col-tl.col);
					return $piece.find(".peg").eq(peg_idx);
				}
			}
		}
		return false;
	}
	
	row_names.unshift("");
	
	for (var row_idx=0; row_idx<=15; row_idx++) {
		$row = $("<div></div>");
		
		if (row_idx==0) $row.attr("id","headers");
		else $row.addClass("row").attr("rel",row_names[row_idx]);
		
		for (var col_idx=0; col_idx<=15; col_idx++) {
			$cell = $("<div></div>");
			
			if (col_idx==0) $cell.addClass("rowlet").text(row_names[row_idx]);
			else if (row_idx==0 && col_idx>0) $cell.text(col_idx);
			else if (row_idx>0 && col_idx>0) $cell.attr("rel",row_names[row_idx]+":"+col_idx).html("<a></a>");
			
			$row.append($cell);
		}
		$board.append($row);
	}
	
	var $contents = $board.children("#headers, .row");
	
	global.Target_Gameboard = function() {
		global.$target_board = $("#target_board");
		global.$target_board.append($contents.clone());
		global.$target_board.click(function(e){
			$(".piece").removeClass("moveable");
			
			var $et = $(e.target), $tmp;
			if (your_turn && $et.is("a") && !$et.hasClass("miss") && !$et.hasClass("hit")) {
				var cell_id = $et.parent().attr("rel");
				global.dread.fire(cell_id);
				set_your_turn(false);
			}
		});
	};

	global.Target_Gameboard.set_peg = set_target_peg;

	global.Target_Gameboard.set_your_turn = set_your_turn;
		
	global.My_Gameboard = function() {
		global.$my_board = $("#my_board");
		global.$my_board.append($contents.clone());
		global.$my_board.find_valid_piece_location = find_valid_piece_location;
		global.$my_board.hide_piece_location_marker = hide_piece_location_marker;
		
		$piece_position_marker = $("<div></div>").attr("id","piece_position_marker");
		$piece_position_marker.appendTo(global.$my_board);
		my_board_offset = global.$my_board.offset();
	};
	
	global.My_Gameboard.set_peg = set_ship_peg;
	
	global.My_Gameboard.get_ships = function() {
		var $pieces = global.$my_board.find(".piece"), ret = {};
		if ($pieces.length < 6) {
			return false;
		}
		$pieces.each(function(){
			var $this = $(this);
			ret[$this.attr("id")] = {top_left:$this.data("top_left"), bottom_right:$this.data("bottom_right")};
		});
		return ret;
	};
		  
})(window,jQuery);